// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ReactDOMFactories'.
const {div, input, button} = ReactDOMFactories
import tr from '../utils/translate'

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'createReactClass'.
export default createReactClass({

  displayName: 'UrlTab',

  getInitialState() {
    return {hover: false}
  },

  importUrl(url: any, via: any) {
    if (typeof this.props.dialog.callback === 'function') {
      this.props.dialog.callback(url, via)
    }
    return this.props.close()
  },

  import() {
    // @ts-expect-error ts-migrate(2686) FIXME: 'ReactDOM' refers to a UMD global, but the current... Remove this comment to see the full error message
    const url = $.trim((ReactDOM.findDOMNode(this.urlRef) as any).value)
    if (url.length === 0) {
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
      return this.props.client.alert(tr("~IMPORT_URL.PLEASE_ENTER_URL"))
    } else {
      return this.importUrl(url, 'select')
    }
  },

  cancel() {
    return this.props.close()
  },

  dragEnter(e: any) {
    e.preventDefault()
    return this.setState({hover: true})
  },

  dragLeave(e: any) {
    e.preventDefault()
    return this.setState({hover: false})
  },

  drop(e: any) {
    e.preventDefault()
    if (e.dataTransfer) {
      const droppedUrls = (e.dataTransfer.getData('url') || e.dataTransfer.getData('text/uri-list') || '').split('\n')
      if (droppedUrls.length > 1) {
        // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
        return this.props.client.alert(tr("~IMPORT_URL.MULTIPLE_URLS_DROPPED"))
      } else if (droppedUrls.length === 1) {
        return this.importUrl(droppedUrls[0], 'drop')
      }
    }
  },

  render() {
    const dropClass = `urlDropArea${this.state.hover ? ' dropHover' : ''}`
    return (div({className: 'dialogTab urlImport'},
      (div({className: dropClass, onDragEnter: this.dragEnter, onDragLeave: this.dragLeave, onDrop: this.drop},
        // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
        (tr("~URL_TAB.DROP_URL_HERE"))
      )),
      (input({ref: ((elt: any) => { return this.urlRef = elt }), placeholder: 'URL'})),
      (div({className: 'buttons'},
        // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
        (button({onClick: this["import"]}, (tr("~URL_TAB.IMPORT")))),
        // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
        (button({onClick: this.cancel}, (tr("~FILE_DIALOG.CANCEL"))))
      ))
    ))
  }
})
