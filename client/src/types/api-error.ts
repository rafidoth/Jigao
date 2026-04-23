export interface ApiFieldError {
    field: string;
    error: string;
}

export type ApiActionType = "redirect" | (string & {});

export interface ApiAction {
    type: ApiActionType;
    message: string;
    value: string;
}

export interface ApiErrorPayload {
    code: string;
    message: string;
    status: number;
    override: boolean;
    errors: ApiFieldError[] | null;
    action: ApiAction | null;
}
