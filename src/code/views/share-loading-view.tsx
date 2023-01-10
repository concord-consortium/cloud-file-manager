import React from 'react'
import translate  from '../utils/translate'
import { Spinner } from './icons/spin'

export const ShareLoadingView = (props: {}) => {
  return (
    <div className='share-loading-view' data-testid='share-loading-view'>
      <Spinner fill="gray" size={100}/>
      {translate("~SHARE_DIALOG.PLEASE_WAIT")}
    </div>
  )
}