/**
 * API 요청을 보내는 함수들을 모아놓은 파일입니다.
 * 
 * entry-ts 레포지토리의 코드를 참조하여 작성하였으나, env 환경변수 객체를 사용할 수 없는 환경이므로,
 * refreshToken 로직을 제거하여 작성하였습니다.
 */


import {
  HttpError,
  isJsonApiErrorBody,
  isJupyterHubErrorBody,
  isOAuth2ErrorBody,
  JsonApiError,
  JupyterHubError,
  OAuth2Error,
} from "../lib/httpError"
import { getCookieToken } from "../lib/cookie"
import { parseJsonResponse } from "../lib/json"
import { getClassRailsUrl } from "../lib/getServiceUrl"
import fetchRetryBuilder from "fetch-retry"

const fetch = fetchRetryBuilder(window.fetch)

export async function fetchClassRails(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  return await fetchRails(getClassRailsUrl(), url, init)
}

/**
 * Rails 서버로 요청을 보내는 함수입니다.
 *
 * env 환경변수 객체를 사용할 수 없는 환경이므로, refreshToken 로직은 생략되어있습니다.
 * v3 정식 출시 이후 runtime env를 주입 가능하게 된다면 401 오류시 refreshToken 로직을 추가할 수 있습니다.
 *
 * @throws {HttpError}
 * @throws {JupyterHubError}
 * @throws {OAuth2Error}
 * @throws {JsonApiError}
 */
async function fetchRails(
  host: string,
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  const do_fetch = async () => {
    return await fetch(host + url, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${getCookieToken("token")}`,
      },
      retries: 3,
      retryDelay: (attempt, _error, _response) => {
        return Math.pow(2, attempt) * 1000
      },
    })
  }

  const res = await do_fetch()

  if (!res.ok) {
    const text = await res.text()
    const jsonResponse = parseJsonResponse(text, res)

    // 반환된 JSON의 형식에 따라 형식에 맞는 에러 객체를 throw합니다.

    if (isJupyterHubErrorBody(jsonResponse)) {
      throw new JupyterHubError(res.status, res.url, jsonResponse)
    }
    if (isOAuth2ErrorBody(jsonResponse)) {
      throw new OAuth2Error(res.status, res.url, jsonResponse)
    }
    if (isJsonApiErrorBody(jsonResponse)) {
      throw new JsonApiError(res.status, res.url, jsonResponse)
    }

    throw new HttpError(res.status, text, res.url)
  }
  return res
}
