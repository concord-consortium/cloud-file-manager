import { HttpError } from "../lib/httpError"

/**
 * fetch 함수로부터 받은 Response 객체의 text를 JSON으로 파싱합니다.
 * @throws {HttpError} JSON 파싱에 실패하거나, JSON이 아닌 경우
 */
export function parseJsonResponse(text: string, res: Response): unknown {
  try {
    return JSON.parse(text)
  } catch {
    throw new HttpError(res.status, text, res.url)
  }
}
