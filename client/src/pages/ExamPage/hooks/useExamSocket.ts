import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "@clerk/clerk-react";
import useWebSocket, { ReadyState } from "react-use-websocket";

import { getWsUrl, WS_RECONNECT_ATTEMPTS, WS_RECONNECT_INTERVAL } from "../constants";
import { useExamStore } from "../store/examStore";
import type { SocketMessage } from "../types";

export function useExamSocket() {
    const { session } = useSession();

    // Get state from store
    const examId = useExamStore((s) => s.examId);
    const role = useExamStore((s) => s.role);
    const phase = useExamStore((s) => s.phase);
    const setConnected = useExamStore((s) => s.setConnected);
    const setSocketSender = useExamStore((s) => s.setSocketSender);
    const handleSocketMessage = useExamStore((s) => s.handleSocketMessage);

    const [token, setToken] = useState<string | null>(null);

    // Fetch token on session change
    useEffect(() => {
        if (!session) {
            setToken(null);
            return;
        }

        let cancelled = false;

        session
            .getToken()
            .then((nextToken) => {
                if (!cancelled) {
                    setToken(nextToken ?? null);
                }
            })
            .catch((error) => {
                console.error("Failed to get auth token for exam socket:", error);
                if (!cancelled) {
                    setToken(null);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [session]);

    // Determine if we should connect
    const shouldConnect =
        examId !== null &&
        role !== null &&
        token !== null &&
        (phase === "lobby" || phase === "running");

    // Build WebSocket URL
    const wsUrl = shouldConnect && examId && role ? getWsUrl(examId, role) : null;

    const options = useMemo(() => ({
        queryParams: token ? { token: `Bearer ${token}` } : undefined,
        shouldReconnect: () => phase === "lobby" || phase === "running",
        reconnectAttempts: WS_RECONNECT_ATTEMPTS,
        reconnectInterval: WS_RECONNECT_INTERVAL,
    }), [phase, token]);

    // WebSocket connection
    const { sendJsonMessage, readyState, lastJsonMessage } = useWebSocket(
        wsUrl,
        options,
        shouldConnect,
    );

    // Send message helper
    const send = useCallback(
        (type: string, payload: unknown) => {
            if (readyState === ReadyState.OPEN) {
                sendJsonMessage({ type, payload });
            } else {
                console.warn("Cannot send message: WebSocket not connected");
            }
        },
        [readyState, sendJsonMessage],
    );

    // Update connection status in store
    useEffect(() => {
        setConnected(readyState === ReadyState.OPEN);
    }, [readyState, setConnected]);

    useEffect(() => {
        setSocketSender(send);
        return () => {
            setSocketSender(null);
        };
    }, [send, setSocketSender]);

    // Handle incoming messages
    useEffect(() => {
        if (lastJsonMessage === null) return;

        try {
            handleSocketMessage(lastJsonMessage as SocketMessage);
        } catch (error) {
            console.error("Failed to handle socket message:", error);
        }
    }, [lastJsonMessage, handleSocketMessage]);

    return {
        send,
        isConnected: readyState === ReadyState.OPEN,
        readyState,
    };
}
