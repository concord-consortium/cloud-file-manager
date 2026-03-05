import createReactClass from 'create-react-class'
import ReactDOMFactories from 'react-dom-factories'
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

  changed(e: React.ChangeEvent<HTMLInputElement>) {
    const { files } = e.target
    if (!files) return
    if (files.length > 1) {
      this.props.client.alert(tr("~LOCAL_FILE_DIALOG.MULTIPLE_FILES_SELECTED"))
    } else if (files.length === 1) {
      this.openFile(files[0], 'select')
    }
  },

  openFile(file: File, via: string) {
    const metadata = new CloudMetadata({
      name: file.name.split('.')[0],
      type: CloudMetadata.File,
      provider: this.props.provider,
      providerData: {
        file
      }
    })
    this.props.dialog.callback?.(metadata, via)
    this.props.close()
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

  drop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    const droppedFiles = e.dataTransfer?.files
    if (!droppedFiles) return
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
      (div({ref: ((elt: any) => { this.dropZoneRef = elt }), className: dropClass, onDragEnter: this.dragEnter, onDragLeave: this.dragLeave},
        (tr("~LOCAL_FILE_DIALOG.DROP_FILE_HERE")),
        (input({type: 'file', onChange: this.changed}))
      )),
      (div({className: 'buttons'},
        (button({onClick: this.cancel}, (tr("~FILE_DIALOG.CANCEL"))))
      ))
    ))
  }
})
