import { EnvironmentName } from "@concord-consortium/token-service"

export const getTokenServiceEnv = () =>  ((window as any).TOKEN_SERVICE_ENV || process.env.TOKEN_SERVICE_ENV || "production") as EnvironmentName
export const DEFAULT_MAX_AGE_SECONDS = 60
export const TOKEN_SERVICE_TOOL_NAME = "cfm-shared"
export const TOKEN_SERVICE_TOOL_TYPE = "s3Folder"
export const S3_SHARED_DOC_PATH_LEGACY = "legacy-document-store"
