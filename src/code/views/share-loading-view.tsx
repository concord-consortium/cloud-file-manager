import React from 'react'
import translate  from '../utils/translate'
import { Spinner } from './icons/spin'

export const ShareLoadingView = (props: {}) => {
  return (
    <div>
      <Spinner fill="gray" size={100}/>
      {/* @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1. */}
      {translate("~SHARE_DIALOG.PLEASE_WAIT")}
    </div>
  )
}