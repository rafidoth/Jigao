import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "@clerk/clerk-react";
import useWebSocket from "react-use-websocket";
import axios from "axios";

import { joinExamApiPost } from "@/api/mutation";

import { getExamSocketStateUpdate } from "./exam-session.handlers";
import type { JoinExamResponse, SocketMessage } from "./exam-session.types";
import { getWsUrl, isJoinExamResponse, toExamUIStatus } from "./exam_utils";
import type { ExamStatus } from "./types";

type UseExamSessionParams = {
  examId?: string;
  examTitle?: string;
};

export function useExamSession({ examId, examTitle }: UseExamSessionParams) {
  const { session } = useSession();

  const [token, setToken] = useState<string | null>(null);
  const [joinInfo, setJoinInfo] = useState<JoinExamResponse | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [joinError, setJoinError] = useState<string | undefined>(undefined);

  const [title, setTitle] = useState("");
  const [examStatus, setExamStatus] = useState<ExamStatus>("");
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());

  useEffect(() => {
    if (!session) return;

    const loadToken = async () => {
      const sessionToken = await session.getToken();
      setToken(sessionToken);
    };

    loadToken();
  }, [session]);

  const wsUrl = useMemo(() => {
    if (!joinInfo) return null;
    return getWsUrl(joinInfo.exam_id, joinInfo.role);
  }, [joinInfo]);

  const canConnectSocket = !!wsUrl && !!token;

  const { lastJsonMessage, sendJsonMessage, readyState } = useWebSocket(
    canConnectSocket ? wsUrl : null,
    {
      queryParams: token ? { token: `Bearer ${token}` } : {},
      shouldReconnect: () => true,
      reconnectAttempts: 5,
      reconnectInterval: 1500,
    },
  );

  const joinMutation = useMutation({
    mutationFn: (targetExamId: string) => joinExamApiPost(targetExamId),
    onSuccess: (data) => {
      if (!isJoinExamResponse(data)) {
        setJoinError("Invalid join response from server.");
        return;
      }

      setIsForbidden(false);
      setJoinError(undefined);
      setJoinInfo(data);
      setExamStatus(toExamUIStatus(data.status));
      setStartTime(new Date(data.start_time));
      setEndTime(new Date(data.end_time));
      if (examTitle) setTitle(examTitle);
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        setIsForbidden(true);
        setJoinError(undefined);
        return;
      }

      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? error.message)
        : "Failed to join exam. Please try again.";
      setJoinError(message);
      setIsForbidden(false);
    },
  });

  useEffect(() => {
    if (lastJsonMessage === null) return;

    const message = lastJsonMessage as SocketMessage;
    const stateUpdate = getExamSocketStateUpdate(message, title);

    if (!stateUpdate) return;
    if (stateUpdate.title !== undefined) setTitle(stateUpdate.title);
    if (stateUpdate.examStatus !== undefined) setExamStatus(stateUpdate.examStatus);
    if (stateUpdate.startTime !== undefined) setStartTime(stateUpdate.startTime);
    if (stateUpdate.endTime !== undefined) setEndTime(stateUpdate.endTime);
  }, [lastJsonMessage, title]);

  const sendEvent = useCallback(
    (type: string, payload: unknown) => {
      if (readyState === 1) {
        sendJsonMessage({ type, payload });
      }
    },
    [readyState, sendJsonMessage],
  );

  const onJoin = useCallback(() => {
    if (!examId) return;
    joinMutation.mutate(examId);
  }, [examId, joinMutation]);

  return {
    joinInfo,
    isForbidden,
    joinError,
    title,
    examStatus,
    startTime,
    endTime,
    sendEvent,
    onJoin,
    isJoining: joinMutation.isPending,
    isConnected: readyState === 1,
  };
}
