// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import createReactClass from "create-react-class"
import ReactDOM from "react-dom"
import ReactDOMFactories from "react-dom-factories"
const {div, input, button} = ReactDOMFactories
import tr from '../utils/translate'

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
    const url = $.trim((ReactDOM.findDOMNode(this.urlRef) as any).value)
    if (url.length === 0) {
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
        (tr("~URL_TAB.DROP_URL_HERE"))
      )),
      (input({ref: ((elt: any) => { return this.urlRef = elt }), placeholder: 'URL'})),
      (div({className: 'buttons'},
        (button({onClick: this["import"]}, (tr("~URL_TAB.IMPORT")))),
        (button({onClick: this.cancel}, (tr("~FILE_DIALOG.CANCEL"))))
      ))
    ))
  }
})
