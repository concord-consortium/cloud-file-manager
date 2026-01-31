import $ from 'jquery'
import React from 'react'

interface IProps {
  zIndex: number
  close?: () => void
}
interface IState {
  backgroundStyle: React.CSSProperties
  contentStyle: React.CSSProperties
}
interface IDimensions {
  width: string
  height: string
}
export default class ModalView extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props)

    const dimensions = this.getDimensions()
    this.state = {
      backgroundStyle: this.getBackgroundStyle(dimensions),
      contentStyle: this.getContentStyle(dimensions)
    }
  }

  closeOnEscape = (e: JQuery.KeyUpEvent) => {
    if (e.keyCode === 27) {
      this.props.close?.()
    }
  }

  // shadow the entire viewport behind the dialog
  getDimensions() {
    return {
      width: '100vw',
      height: '100vh'
    }
  }

  getBackgroundStyle(dimensions: IDimensions) {
    if (this.props.zIndex) {
      return { zIndex: this.props.zIndex, width: dimensions.width, height: dimensions.height }
    } else {
      return dimensions
    }
  }

  getContentStyle(dimensions: IDimensions) {
    if (this.props.zIndex) {
      return { zIndex: this.props.zIndex + 1, width: dimensions.width, height: dimensions.height }
    } else {
      return dimensions
    }
  }

  updateStyles = () => {
    const dimensions = this.getDimensions()
    this.setState({
      backgroundStyle: this.getBackgroundStyle(dimensions),
      contentStyle: this.getContentStyle(dimensions)
    })
  }

  // use bind/unbind for clients using older versions of jQuery
  componentDidMount() {
    $(window).bind('keyup', this.closeOnEscape)
    $(window).bind('resize', this.updateStyles)
  }

  componentWillUnmount() {
    $(window).unbind('keyup', this.closeOnEscape)
    $(window).unbind('resize', this.updateStyles)
  }

  render() {
    const { backgroundStyle, contentStyle } = this.state
    return (
      <div className='modal'>
        <div className='modal-background' style={backgroundStyle} />
        <div className='modal-content' style={contentStyle}>
          {this.props.children}
        </div>
      </div>
    )
  }
}
