import $ from "jquery"
import screenfull from "screenfull"

/* globals */
(window as any).GetIframeTransforms = function (_window: any, _screen: any) {
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
  var $target = $(iframe)
  function setScaling () {
    if (!(screenfull as any).isFullscreen) {
      var trans = (window as any).GetIframeTransforms(window, screen)
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

  function setupFullsceenButton () {
    $('#fullscreen-help').show()
    var $button = $('.fullscreen-icon')
    $button.show()
    $button.on('click', () => (screenfull as any).toggle());
    (screenfull as any).on('change', () => {
      if((screenfull as any).isFullscreen) {
        $button.addClass('fullscreen')
      }
      else {
        $button.removeClass('fullscreen')
      }
    })
  }

  setScaling()
  if (screenfull.isEnabled) {
    setupFullsceenButton()
  }
  $(window).on('resize', setScaling)
}
