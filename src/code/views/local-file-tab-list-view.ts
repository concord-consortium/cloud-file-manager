// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {div, input, button} = ReactDOMFactories
import tr from '../utils/translate'
import { CloudMetadata } from '../providers/provider-interface'

export default createReactClass({

  displayName: 'LocalFileListTab',

  // Standard React 'drop' event handlers are triggered after client 'drop' event handlers.
  // By explicitly installing DOM event handlers we get first crack at the 'drop' event.
  componentDidMount() {
    this.dropZoneRef.addEventListener('drop', this.drop)
  },

  componentWillUnmount() {
    this.dropZoneRef.removeEventListener('drop', this.drop)
  },

  getInitialState() {
    return {hover: false}
  },

  changed(e: any) {
    const { files } = e.target
    if (files.length > 1) {
      return this.props.client.alert(tr("~LOCAL_FILE_DIALOG.MULTIPLE_FILES_SELECTED"))
    } else if (files.length === 1) {
      return this.openFile(files[0], 'select')
    }
  },

  openFile(file: any, via: any) {
    const metadata = new CloudMetadata({
      name: file.name.split('.')[0],
      type: (CloudMetadata as any).File,
      parent: null,
      provider: this.props.provider,
      providerData: {
        file
      }
    })
    if (typeof this.props.dialog.callback === 'function') {
      this.props.dialog.callback(metadata, via)
    }
    return this.props.close()
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
    e.stopPropagation()
    const droppedFiles = e.dataTransfer ? e.dataTransfer.files : e.target.files
    if (droppedFiles.length > 1) {
      this.props.client.alert(tr("~LOCAL_FILE_DIALOG.MULTIPLE_FILES_DROPPED"))
    } else if (droppedFiles.length === 1) {
      this.openFile(droppedFiles[0], 'drop')
    }
  },

  render() {
    const dropClass = `dropArea${this.state.hover ? ' dropHover' : ''}`
    return (div({className: 'dialogTab localFileLoad'},
      // 'drop' event handler installed as DOM event handler in componentDidMount()
      (div({ref: ((elt: any) => { return this.dropZoneRef = elt }), className: dropClass, onDragEnter: this.dragEnter, onDragLeave: this.dragLeave},
        (tr("~LOCAL_FILE_DIALOG.DROP_FILE_HERE")),
        (input({type: 'file', onChange: this.changed}))
      )),
      (div({className: 'buttons'},
        (button({onClick: this.cancel}, (tr("~FILE_DIALOG.CANCEL"))))
      ))
    ))
  }
})
