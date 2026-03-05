import React, { useState, useRef } from 'react'
import tr from '../utils/translate'

interface UrlTabProps {
  dialog: {
    callback?: (url: string, via: string) => void
  }
  close: () => void
  client: {
    alert: (message: string) => void
  }
}

const UrlTab: React.FC<UrlTabProps> = ({ dialog, close, client }) => {
  const [hover, setHover] = useState(false)
  const urlRef = useRef<HTMLInputElement>(null)

  const importUrl = (url: string, via: string) => {
    dialog.callback?.(url, via)
    close()
  }

  const handleImport = () => {
    const url = urlRef.current?.value.trim() ?? ''
    if (url.length === 0) {
      client.alert(tr("~IMPORT_URL.PLEASE_ENTER_URL"))
    } else {
      importUrl(url, 'select')
    }
  }

  const handleCancel = () => {
    close()
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setHover(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setHover(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer) {
      const droppedUrls = (e.dataTransfer.getData('url') || e.dataTransfer.getData('text/uri-list') || '').split('\n')
      if (droppedUrls.length > 1) {
        client.alert(tr("~IMPORT_URL.MULTIPLE_URLS_DROPPED"))
      } else if (droppedUrls.length === 1) {
        importUrl(droppedUrls[0], 'drop')
      }
    }
  }

  const dropClass = `urlDropArea${hover ? ' dropHover' : ''}`

  return (
    <div className="dialogTab urlImport">
      <div
        className={dropClass}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {tr("~URL_TAB.DROP_URL_HERE")}
      </div>
      <input ref={urlRef} placeholder="URL" />
      <div className="buttons">
        <button onClick={handleImport}>{tr("~URL_TAB.IMPORT")}</button>
        <button onClick={handleCancel}>{tr("~FILE_DIALOG.CANCEL")}</button>
      </div>
    </div>
  )
}

export default UrlTab
