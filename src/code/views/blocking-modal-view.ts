import createReactClass from 'create-react-class'
import ReactDOMFactories from 'react-dom-factories'
import { createReactFactory } from '../create-react-factory'
const {div} = ReactDOMFactories

import modalView from './modal-view'
const Modal = createReactFactory(modalView)

export default createReactClass({

  displayName: 'BlockingModal',

  close() {
    this.props.close?.()
  },

  // used by CODAP to dismiss the startup dialog if a file is dropped on it
  drop(e: React.DragEvent<HTMLDivElement>) {
    this.props.onDrop?.(e)
  },

  render() {
    return (Modal({close: this.props.close},
      (div({className: 'modal-dialog', onDrop: this.drop},
        (div({className: 'modal-dialog-wrapper'},
          (div({className: 'modal-dialog-title'},
            this.props.title || 'Untitled Dialog'
          )),
          (div({className: 'modal-dialog-workspace'},
            (div({className: 'modal-dialog-blocking-message'}, this.props.message))
          ))
        ))
      ))
    ))
  }
})
