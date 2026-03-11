import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type UserId = bigint;
export type AuthToken = bigint;
export interface UserData {
    id: UserId;
    username: string;
    irisTemplate: string;
    passwordHash: string;
    registeredAt: bigint;
}
export enum AuthResult {
    userNotFound = "userNotFound",
    irisMismatch = "irisMismatch",
    internalError = "internalError",
    success = "success",
    invalidCredentials = "invalidCredentials"
}
export interface backendInterface {
    getAllUsernames(): Promise<Array<string>>;
    getAllUsers(): Promise<Array<UserData>>;
    getOldestUser(): Promise<UserData>;
    getProfile(token: AuthToken): Promise<UserData>;
    isUsernameAvailable(username: string): Promise<boolean>;
    login(username: string, passwordHash: string, irisTemplate: string): Promise<{
        result: AuthResult;
        token?: AuthToken;
    }>;
    register(username: string, passwordHash: string, irisTemplate: string): Promise<AuthResult>;
}
