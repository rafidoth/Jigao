import { useCallback, useEffect, useRef } from "react";
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
    const handleSocketMessage = useExamStore((s) => s.handleSocketMessage);

    // Token state
    const tokenRef = useRef<string | null>(null);

    // Fetch token on session change
    useEffect(() => {
        if (!session) {
            tokenRef.current = null;
            return;
        }

        session.getToken().then((token) => {
            tokenRef.current = token;
        });
    }, [session]);

    // Determine if we should connect
    const shouldConnect =
        examId !== null &&
        role !== null &&
        tokenRef.current !== null &&
        (phase === "lobby" || phase === "running");

    // Build WebSocket URL
    const wsUrl = shouldConnect && examId && role ? getWsUrl(examId, role) : null;
    console.log("wsUrl ", wsUrl)
    // const options = useMemo(() => ({
    //     queryParams: tokenRef.current ? { token: `Bearer ${token}` } : {},
    //     shouldReconnect: () => phase === "lobby" || phase === "running",
    //     reconnectAttempts: WS_RECONNECT_ATTEMPTS,
    //     reconnectInterval: WS_RECONNECT_INTERVAL,
    // }), [token, phase]);

    // WebSocket connection
    const { sendJsonMessage, readyState, lastJsonMessage } = useWebSocket(
        wsUrl,
        {
            queryParams: tokenRef.current ? { token: `Bearer ${tokenRef.current}` } : {},
            shouldReconnect: () => phase === "lobby" || phase === "running",
            reconnectAttempts: WS_RECONNECT_ATTEMPTS,
            reconnectInterval: WS_RECONNECT_INTERVAL,
        },
        shouldConnect,
    );

    // Update connection status in store
    useEffect(() => {
        setConnected(readyState === ReadyState.OPEN);
    }, [readyState, setConnected]);

    // Handle incoming messages
    useEffect(() => {
        if (lastJsonMessage === null) return;

        try {
            handleSocketMessage(lastJsonMessage as SocketMessage);
        } catch (error) {
            console.error("Failed to handle socket message:", error);
        }
    }, [lastJsonMessage, handleSocketMessage]);

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

    return {
        send,
        isConnected: readyState === ReadyState.OPEN,
        readyState,
    };
}
