// @ts-expect-error ts-migrate(7011) FIXME: Function expression, which lacks return-type annot... Remove this comment to see the full error message
export default function(param: any) {
  let ret = null
  //eslint-disable-next-line array-callback-return
  location.hash.substr(1).split("&").some(function(pair) {
    const key = pair.split("=")[0]
    if (key === param) {
      let value = pair.split("=")[1]
      // eslint-disable-next-line no-constant-condition
      while (true) {
        value = decodeURIComponent(value)
        // deal with multiply-encoded values
        if (!/%20|%25/.test(value)) { break }
      }
      return ret = value
    }
  })
  return ret
}
