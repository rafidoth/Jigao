import { WifiOff } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useIsConnected } from "../store/examStore";

function ConnectionBanner() {
    const isConnected = useIsConnected();

    if (isConnected) {
        return null;
    }

    return (
        <Alert variant="destructive" className="mb-4">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Connection Lost</AlertTitle>
            <AlertDescription>
                You've been disconnected from the exam server. Your answers are saved locally.
                Attempting to reconnect...
            </AlertDescription>
        </Alert>
    );
}

export default ConnectionBanner;
