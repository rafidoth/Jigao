import type { ApiErrorPayload, ApiAction, ApiFieldError } from "@/types/api-error";

const DEFAULT_UNKNOWN_ERROR: ApiErrorPayload = {
    code: "UNKNOWN_ERROR",
    message: "Something went wrong",
    status: 500,
    override: false,
    errors: null,
    action: null,
};

export class AppApiError extends Error {
    readonly payload: ApiErrorPayload;
    readonly original?: unknown;

    constructor(payload: ApiErrorPayload, original?: unknown) {
        super(payload.message);
        this.name = "AppApiError";
        this.payload = payload;
        this.original = original;
    }
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isApiFieldError(value: unknown): value is ApiFieldError {
    if (!isObject(value)) {
        return false;
    }

    return typeof value.field === "string" && typeof value.error === "string";
}

function isApiAction(value: unknown): value is ApiAction {
    if (!isObject(value)) {
        return false;
    }

    return (
        typeof value.type === "string" &&
        typeof value.message === "string" &&
        typeof value.value === "string"
    );
}

function isApiFieldErrorList(value: unknown): value is ApiFieldError[] {
    return Array.isArray(value) && value.every(isApiFieldError);
}

export function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
    if (!isObject(value)) {
        return false;
    }

    const hasValidErrors = value.errors === null || isApiFieldErrorList(value.errors);
    const hasValidAction = value.action === null || isApiAction(value.action);

    return (
        typeof value.code === "string" &&
        typeof value.message === "string" &&
        typeof value.status === "number" &&
        typeof value.override === "boolean" &&
        hasValidErrors &&
        hasValidAction
    );
}

export function toApiErrorPayload(
    candidate: unknown,
    fallback?: Partial<ApiErrorPayload>,
): ApiErrorPayload {
    if (isApiErrorPayload(candidate)) {
        return candidate;
    }

    return {
        code: fallback?.code ?? DEFAULT_UNKNOWN_ERROR.code,
        message: fallback?.message ?? DEFAULT_UNKNOWN_ERROR.message,
        status: fallback?.status ?? DEFAULT_UNKNOWN_ERROR.status,
        override: fallback?.override ?? DEFAULT_UNKNOWN_ERROR.override,
        errors:
            fallback && "errors" in fallback
                ? fallback.errors ?? null
                : DEFAULT_UNKNOWN_ERROR.errors,
        action:
            fallback && "action" in fallback
                ? fallback.action ?? null
                : DEFAULT_UNKNOWN_ERROR.action,
    };
}

export function normalizeApiError(error: unknown): AppApiError {
    if (error instanceof AppApiError) {
        return error;
    }

    if (!isObject(error)) {
        return new AppApiError(DEFAULT_UNKNOWN_ERROR, error);
    }

    const messageFromError = typeof error.message === "string" ? error.message : undefined;
    const response = isObject(error.response) ? error.response : undefined;
    const data = response && "data" in response ? response.data : undefined;
    const status =
        response && typeof response.status === "number"
            ? response.status
            : DEFAULT_UNKNOWN_ERROR.status;

    const payload = toApiErrorPayload(data, {
        status,
        message: messageFromError ?? DEFAULT_UNKNOWN_ERROR.message,
    });

    return new AppApiError(payload, error);
}

export function isAppApiError(error: unknown): error is AppApiError {
    return error instanceof AppApiError;
}

export function isForbiddenError(error: unknown): boolean {
    const normalized = normalizeApiError(error);
    return normalized.payload.status === 403 || normalized.payload.code === "FORBIDDEN";
}

export function getErrorMessage(error: unknown): string {
    return normalizeApiError(error).payload.message;
}
