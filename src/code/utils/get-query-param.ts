export default function(param: string) {
  param = param.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]")
  const regexS = `[\\?&]${param}=([^&#]*)`
  const regex = new RegExp(regexS)
  const results = regex.exec(window.location.href)
  if (results?.length && results.length > 1) {
    return decodeURIComponent(results[1])
  } else {
    return null
  }
}
