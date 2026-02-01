import React, { useState, useRef, useEffect } from 'react'
import ModalDialogView from './modal-dialog-view'
import tr from '../utils/translate'
import { CloudMetadata } from '../providers/provider-interface'

interface DownloadDialogViewProps {
  filename?: string
  content: any
  client: {
    isShared: () => boolean
    getDownloadUrl: (content: any, includeShareInfo: boolean) => string
  }
  close?: () => void
}

const DownloadDialogView: React.FC<DownloadDialogViewProps> = ({ filename: initialFilename, content, client, close }) => {
  const defaultFilename = CloudMetadata.withExtension(initialFilename || tr("~MENUBAR.UNTITLED_DOCUMENT"), 'json')
  const [filename, setFilename] = useState(defaultFilename)
  const [includeShareInfo, setIncludeShareInfo] = useState(false)
  const [shared] = useState(() => client.isShared())

  const filenameRef = useRef<HTMLInputElement>(null)
  const downloadRef = useRef<HTMLAnchorElement>(null)

  const trimmedFilename = filename.replace(/^\s+|\s+$/, '')
  const downloadDisabled = trimmedFilename.length === 0

  useEffect(() => {
    filenameRef.current?.focus()
  }, [])

  const handleFilenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilename(e.target.value)
  }

  const handleIncludeShareInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeShareInfo(e.target.checked)
  }

  const handleDownload = (e: React.MouseEvent<HTMLAnchorElement> | null, simulateClick: boolean) => {
    if (!downloadDisabled) {
      downloadRef.current?.setAttribute('href', client.getDownloadUrl(content, includeShareInfo))
      if (simulateClick) {
        downloadRef.current?.click()
      }
      close?.()
    } else {
      e?.preventDefault()
      filenameRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode === 13 && !downloadDisabled) {
      e.preventDefault()
      e.stopPropagation()
      handleDownload(null, true)
    }
  }

  return (
    <ModalDialogView title={tr('~DIALOG.DOWNLOAD')} close={close}>
      <div className="download-dialog">
        <input
          type="text"
          ref={filenameRef}
          placeholder="Filename"
          value={filename}
          onChange={handleFilenameChange}
          onKeyDown={handleKeyDown}
        />
        {shared && (
          <div className="download-share">
            <input
              type="checkbox"
              checked={includeShareInfo}
              onChange={handleIncludeShareInfoChange}
            />
            {tr('~DOWNLOAD_DIALOG.INCLUDE_SHARE_INFO')}
          </div>
        )}
        <div className="buttons">
          <a
            href="#"
            ref={downloadRef}
            className={downloadDisabled ? 'disabled' : ''}
            download={trimmedFilename}
            onClick={(e) => handleDownload(e, false)}
          >
            {tr('~DOWNLOAD_DIALOG.DOWNLOAD')}
          </a>
          <button onClick={close}>{tr('~DOWNLOAD_DIALOG.CANCEL')}</button>
        </div>
      </div>
    </ModalDialogView>
  )
}

export default DownloadDialogView
