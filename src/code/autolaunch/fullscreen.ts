import $ from "jquery"
// must use `require` not `import` (cf. https://github.com/sindresorhus/screenfull.js/releases/tag/v5.0.0)
import _screenfull = require('screenfull')

/* globals */
const getIframeTransforms = (_window: Window, _screen: Screen) => {
  var MAX_WIDTH = 2000
  // Scale iframe, but make sure that:
  // 1. Iframe is smaller than MAX_WIDTH which should be enough for all the documents. It prevents creating
  //    some huge CODAP canvases on really big screens (e.g. 4k monitors).
  // 2. Iframe is not smaller than size of the current window.
  var width  = Math.max(_window.innerWidth, Math.min(MAX_WIDTH, _screen.width))
  var scale  = _window.innerWidth  / width
  var height = _window.innerHeight / scale
  return {
    scale: scale,
    unscaledWidth: width,
    unscaledHeight: height
  }
}

export function fullscreenSupport (iframe: any) {
  // must check isEnabled before accessing other APIs
  // cf. https://github.com/sindresorhus/screenfull.js/issues/173#issuecomment-735226048
  const screenfull = _screenfull.isEnabled ? _screenfull : undefined
  var $target = $(iframe)
  function setScaling () {
    if (!screenfull?.isFullscreen) {
      var trans = getIframeTransforms(window, screen)
      $target.css('width', trans.unscaledWidth)
      $target.css('height', trans.unscaledHeight)
      $target.css('transform-origin', 'top left')
      $target.css('transform', 'scale3d(' + trans.scale + ',' + trans.scale + ',1)')
    } else {
      // Disable scaling in fullscreen mode.
      $target.css('width', '100%')
      $target.css('height', '100%')
      $target.css('transform', 'scale3d(1,1,1)')
    }
    // Help text.
    const fontSize = Math.round(Math.pow(window.innerWidth / 5, 0.65))
    $('#fullscreen-help').css('fontSize', `${fontSize}px`)
  }

  function setupFullscreenButton () {
    $('#fullscreen-help').show()
    var $button = $('.fullscreen-icon')
    $button.show()
    $button.on('click', () => screenfull.toggle())
    screenfull.on('change', () => {
      if(screenfull.isFullscreen) {
        $button.addClass('fullscreen')
      }
      else {
        $button.removeClass('fullscreen')
      }
    })
  }

  setScaling()
  if (screenfull?.isEnabled) {
    setupFullscreenButton()
  }
  $(window).on('resize', setScaling)
}
