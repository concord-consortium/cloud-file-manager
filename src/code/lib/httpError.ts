/**
 * HTTP 요청에 대한 에러 클래스와 에러 바디 타입을 정의합니다.
 * main-react httpError.ts 파일을 가져왔습니다.
 */

/** @link https://jsonapi.org/format/#errors */
export type JsonApiErrorBody = {
  errors: { status: string; detail: string; title: string; code?: string }[]
}

/** @link https://github.com/jupyterhub/jupyterhub/blob/main/jupyterhub/apihandlers/base.py#L167 */
export type JupyterHubErrorBody = {
  status: number
  message: string
}

/** @link https://datatracker.ietf.org/doc/html/rfc6749#section-5.2 */
export type OAuth2ErrorBody = {
  error: string // 필수: 오류 코드 (예: "invalid_request", "unauthorized_client" 등)
  error_description?: string // 선택: 오류에 대한 설명
  error_uri?: string // 선택: 오류에 대한 추가 정보가 있는 URI
  state?: string // 선택: 클라이언트에서 전송한 상태 값 (보통 CSRF 공격 방지를 위해 사용)
  options?: unknown // 선택: 오류에 대한 추가 정보
}

// error body에 대한 타입 가드 함수들을 정의합니다.
// body에 특정 필드의 유무를 통해 타입을 판별하고 있으며
// 새로운 타입의 ErrorBody가 추가되면 아래의 기존 함수들도 영향을 받을 수 있습니다.

export function isJsonApiErrorBody(body: unknown): body is JsonApiErrorBody {
  return typeof body === "object" && body != null && "errors" in body
}

export function isOAuth2ErrorBody(body: unknown): body is OAuth2ErrorBody {
  return typeof body === "object" && body != null && "error" in body
}

export function isJupyterHubErrorBody(
  body: unknown
): body is JupyterHubErrorBody {
  return typeof body === "object" && body != null && "status" in body
}

/** HTTP 요청에 대한 에러 클래스입니다. */
export class HttpError extends Error {
  status: number
  url: string

  constructor(status: number, message: string, url: string) {
    super(message)
    this.status = status
    this.name = "HttpError"
    this.url = url
  }
}

/** JupyterHub API 요청에 대한 에러 클래스입니다. */
export class JupyterHubError extends HttpError {
  body: JupyterHubErrorBody

  constructor(status: number, url: string, body: JupyterHubErrorBody) {
    const message = body.message
    super(status, message, url)
    this.status = status
    this.name = "JupyterHubError"
    this.body = body
  }
}

/** OAuth2 요청에 대한 에러 클래스입니다. */
export class OAuth2Error extends HttpError {
  body: OAuth2ErrorBody

  constructor(status: number, url: string, body: OAuth2ErrorBody) {
    const message = body.error_description ?? body.error
    super(status, message, url)
    this.status = status
    this.name = "OAuth2Error"
    this.body = body
  }
}

/** JSON API 요청에 대한 에러 클래스입니다. */
export class JsonApiError extends HttpError {
  body: JsonApiErrorBody

  constructor(status: number, url: string, body: JsonApiErrorBody) {
    const message = body.errors.map((error) => error.detail).join("\n")
    super(status, message, url)
    this.status = status
    this.name = "JsonApiError"
    this.body = body
  }
}
