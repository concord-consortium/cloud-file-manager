import $ from "jquery"
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

  importUrl(url: string, via: string) {
    this.props.dialog.callback?.(url, via)
    this.props.close()
  },

  import() {
    const url = $.trim((ReactDOM.findDOMNode(this.urlRef) as any).value)
    if (url.length === 0) {
      this.props.client.alert(tr("~IMPORT_URL.PLEASE_ENTER_URL"))
    } else {
      this.importUrl(url, 'select')
    }
  },

  cancel() {
    this.props.close()
  },

  dragEnter(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    this.setState({hover: true})
  },

  dragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    this.setState({hover: false})
  },

  drop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (e.dataTransfer) {
      const droppedUrls = (e.dataTransfer.getData('url') || e.dataTransfer.getData('text/uri-list') || '').split('\n')
      if (droppedUrls.length > 1) {
        this.props.client.alert(tr("~IMPORT_URL.MULTIPLE_URLS_DROPPED"))
      } else if (droppedUrls.length === 1) {
        this.importUrl(droppedUrls[0], 'drop')
      }
    }
  },

  render() {
    const dropClass = `urlDropArea${this.state.hover ? ' dropHover' : ''}`
    return (div({className: 'dialogTab urlImport'},
      (div({className: dropClass, onDragEnter: this.dragEnter, onDragLeave: this.dragLeave, onDrop: this.drop},
        (tr("~URL_TAB.DROP_URL_HERE"))
      )),
      (input({ref: ((elt: any) => { this.urlRef = elt }), placeholder: 'URL'})),
      (div({className: 'buttons'},
        (button({onClick: this["import"]}, (tr("~URL_TAB.IMPORT")))),
        (button({onClick: this.cancel}, (tr("~FILE_DIALOG.CANCEL"))))
      ))
    ))
  }
})
