import React, { useState, useRef, useEffect } from 'react'
import tr from '../utils/translate'
import { CloudMetadata, ProviderInterface } from '../providers/provider-interface'

interface LocalFileListTabProps {
  dialog: {
    callback?: (metadata: CloudMetadata, via: string) => void
  }
  close: () => void
  client: {
    alert: (message: string) => void
  }
  provider: ProviderInterface
}

const LocalFileListTab: React.FC<LocalFileListTabProps> = ({ dialog, close, client, provider }) => {
  const [hover, setHover] = useState(false)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const openFile = (file: File, via: string) => {
    const metadata = new CloudMetadata({
      name: file.name.split('.')[0],
      type: CloudMetadata.File,
      provider,
      providerData: {
        file
      }
    })
    dialog.callback?.(metadata, via)
    close()
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const droppedFiles = e.dataTransfer?.files
    if (!droppedFiles) return
    if (droppedFiles.length > 1) {
      client.alert(tr("~LOCAL_FILE_DIALOG.MULTIPLE_FILES_DROPPED"))
    } else if (droppedFiles.length === 1) {
      openFile(droppedFiles[0], 'drop')
    }
  }

  // Standard React 'drop' event handlers are triggered after client 'drop' event handlers.
  // By explicitly installing DOM event handlers we get first crack at the 'drop' event.
  useEffect(() => {
    const dropZone = dropZoneRef.current
    if (dropZone) {
      dropZone.addEventListener('drop', handleDrop)
      return () => {
        dropZone.removeEventListener('drop', handleDrop)
      }
    }
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target
    if (!files) return
    if (files.length > 1) {
      client.alert(tr("~LOCAL_FILE_DIALOG.MULTIPLE_FILES_SELECTED"))
    } else if (files.length === 1) {
      openFile(files[0], 'select')
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

  const dropClass = `dropArea${hover ? ' dropHover' : ''}`

  return (
    <div className="dialogTab localFileLoad">
      {/* 'drop' event handler installed as DOM event handler in useEffect() */}
      <div
        ref={dropZoneRef}
        className={dropClass}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {tr("~LOCAL_FILE_DIALOG.DROP_FILE_HERE")}
        <input type="file" onChange={handleChange} />
      </div>
      <div className="buttons">
        <button onClick={handleCancel}>{tr("~FILE_DIALOG.CANCEL")}</button>
      </div>
    </div>
  )
}

export default LocalFileListTab
