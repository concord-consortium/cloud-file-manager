// http://stackoverflow.com/a/2880929
var urlParams = {}
if (window?.location?.search) {
  (window.onpopstate = popState)()
}

function popState() {
  var match,
      pl     = /\+/g,  // Regex for replacing addition symbol with a space
      search = /([^&=]+)=?([^&]*)/g,
      decode = function (s: any) { return decodeURIComponent(s.replace(pl, " ")) },
      query  = window.location.search.substring(1)

  while ((match = search.exec(query)))
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      urlParams[decode(match[1])] = decode(match[2])
}

export default urlParams
