import React from 'react'

import tr  from '../utils/translate'
import ModalDialogView from './modal-dialog-view'
import { IInteractiveStateProps } from '@concord-consortium/lara-interactive-api'

interface IProps {
  version: IInteractiveStateProps<{}>
  showingOverlay: boolean
  onSelect?: SelectInteractiveStateCallback
  onPreview: (showing: boolean) => void
  close?: () => void
}

interface IState {
  preview: boolean
}

class SelectInteractiveStateVersion extends React.Component<IProps, IState> {

  state = {
    preview: false
  }

  handleSelect = () => {
    this.props.onSelect(this.props.version.interactiveState)
    this.props.close?.()
  }

  handleTogglePreview = () => {
    this.setState((prev) => {
      const preview = !prev.preview
      this.props.onPreview(preview)
      return {preview}
    })
  }

  UNSAFE_componentWillReceiveProps(props: IProps) {
    // hide the preview if the overlay text is clicked in the parent
    if (!props.showingOverlay && this.state.preview) {
      this.setState({preview: false})
    }
  }

  render() {
    const {preview} = this.state
    const {version} = this.props
    const updatedAt = (new Date(version.updatedAt)).toLocaleString()
    const previewClassName = `preview${preview ? ' preview-active' : ''}`
    const previewIframeClassName = preview ? 'preview-iframe-fullsize' : 'preview-iframe'

    return (
      <div className='version-info'>
        <div className='dialog-button' onClick={this.handleSelect}>
          {tr('~DIALOG.SELECT_INTERACTIVE_STATE.USE_THIS_VERSION')}
        </div>
        <div className={previewClassName} onClick={this.handleTogglePreview}>
          <div className='iframe-wrapper'>
            <iframe className={previewIframeClassName} src={version.externalReportUrl}></iframe>
          </div>
        </div>
        <div className='center preview-label' onClick={this.handleTogglePreview}>
          {tr('~DIALOG.SELECT_INTERACTIVE_STATE.CLICK_TO_PREVIEW')}
        </div>
        <table className='version-desc'>
          <tbody>
            <tr>
              <th>{tr('~DIALOG.SELECT_INTERACTIVE_STATE.UPDATED_AT')}</th>
              <td>{updatedAt}</td>
            </tr>
            <tr>
              <th>{tr('~DIALOG.SELECT_INTERACTIVE_STATE.PAGE')}</th>
              <td>
                <span>{version.pageNumber}</span>
                <span>{version.pageName ? ` - ${version.pageName}` : ""}</span>
              </td>
            </tr>
            <tr>
              <th>{tr('~DIALOG.SELECT_INTERACTIVE_STATE.ACTIVITY')}</th>
              <td>{version.activityName}</td>
            </tr>
            </tbody>
        </table>
      </div>
    )
  }
}

export interface SelectInteractiveStateDialogProps {
  state1: IInteractiveStateProps<{}>
  state2: IInteractiveStateProps<{}>
  interactiveStateAvailable: boolean,
  onSelect?: SelectInteractiveStateCallback
  close?: () => void
}
export type SelectInteractiveStateCallback = (selected: {}) => void

interface SelectInteractiveStateDialogState {
  showOverlay: boolean
}

export default class SelectInteractiveStateDialog extends React.Component<SelectInteractiveStateDialogProps, SelectInteractiveStateDialogState> {

  state = {
    showOverlay: false
  }

  handleOnPreview = (showOverlay: boolean) => {
    this.setState({showOverlay})
  }

  handleHideOverlay = () => {
    this.setState({showOverlay: false})
  }

  render() {
    const {showOverlay} = this.state
    const {state1, state2, interactiveStateAvailable, onSelect, close} = this.props
    const overlayClassname = `overlay${showOverlay ? ' show-overlay' : ''}`

    const question = interactiveStateAvailable
        ? tr('~DIALOG.SELECT_INTERACTIVE_STATE.CURRENT_VS_LINKED')
        : tr('~DIALOG.SELECT_INTERACTIVE_STATE.LINKED_VS_LINKED')

    return (
      <ModalDialogView title={tr('~DIALOG.SELECT_INTERACTIVE_STATE.TITLE')}>
        <div className='select-interactive-state-dialog'>
          <div className={overlayClassname} onClick={this.handleHideOverlay}>
            {tr('~DIALOG.SELECT_INTERACTIVE_STATE.PREVIEW_INFO')}
          </div>
          <div className='content'>
            <div id='question'>{question}</div>
            <div className='scroll-wrapper'>
              <div className='versions'>
                <SelectInteractiveStateVersion version={state1} showingOverlay={showOverlay} onSelect={onSelect} onPreview={this.handleOnPreview} close={close} />
                <SelectInteractiveStateVersion version={state2} showingOverlay={showOverlay} onSelect={onSelect} onPreview={this.handleOnPreview} close={close} />
              </div>
            </div>
          </div>
        </div>
      </ModalDialogView>
    )
  }
}
