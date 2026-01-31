export interface APIBaseResponse<T> {
    data: T;
    success: boolean;
    message?: string;
}

export interface CurrentUserBasicInfo {
    username: string;
    email: string;
    is_staff: boolean;
}