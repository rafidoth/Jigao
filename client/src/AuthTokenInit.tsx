

import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { setTokenGetter } from "./api/client";

export function AuthBridge() {
    const { getToken } = useAuth();

    useEffect(() => {
        setTokenGetter(() => getToken());
    }, [getToken]);

    return null;
}
