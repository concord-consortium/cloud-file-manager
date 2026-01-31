import React, { useState, useRef, useEffect } from 'react'
import { saveAs } from 'file-saver'
import { CloudMetadata, ProviderInterface, cloudContentFactory } from '../providers/provider-interface'
import { isIOSSafari, handleIOSDownload } from '../utils/ios-file-saver'
import tr from '../utils/translate'

interface LocalFileSaveTabProps {
  dialog: {
    data?: {
      content?: any
      extension?: string
      mimeType?: string
    }
    callback: (metadata: CloudMetadata) => void
  }
  close: () => void
  client: {
    appOptions?: {
      extension?: string
      localFileMimeType?: string
      mimeType?: string
    }
    state?: {
      metadata?: CloudMetadata
      currentContent?: any
    }
    isShared: () => boolean
    _sharedMetadata: () => any
    _event: (event: string, data: any, callback: (content: any) => void) => void
    getDownloadBlob: (content: any, includeShareInfo: boolean, mimeType: string) => Blob
    getDownloadUrl: (content: any, includeShareInfo: boolean, mimeType: string) => string
  }
  provider: ProviderInterface
}

const LocalFileSaveTab: React.FC<LocalFileSaveTabProps> = ({ dialog, close, client, provider }) => {
  const { data } = dialog
  const { appOptions } = client
  const { metadata } = client.state ?? {}

  const hasPropsContent = data?.content != null
  const extension = hasPropsContent && data.extension ? data.extension : (appOptions?.extension ?? 'json')
  const mimeType = hasPropsContent && data.mimeType ? data.mimeType : (appOptions?.localFileMimeType ?? appOptions?.mimeType ?? 'text/plain')
  const initialFilename = metadata?.name ?? tr("~MENUBAR.UNTITLED_DOCUMENT")

  const getDownloadFilename = (hasContent: boolean, fname: string, ext: string) => {
    const newName = fname.replace(/^\s+|\s+$/, '')
    if (hasContent) {
      return CloudMetadata.newExtension(newName, ext)
    } else {
      return CloudMetadata.withExtension(newName, ext)
    }
  }

  const [filename, setFilename] = useState(initialFilename)
  const [supportsDownloadAttribute] = useState(() => document.createElement('a').download !== undefined)
  const [downloadFilename, setDownloadFilename] = useState(() => getDownloadFilename(hasPropsContent, initialFilename, extension))
  const [shared] = useState(() => client.isShared())
  const [includeShareInfo, setIncludeShareInfo] = useState(hasPropsContent)
  const [gotContent, setGotContent] = useState(hasPropsContent)
  const [content, setContent] = useState<any>(hasPropsContent ? data.content : undefined)

  const filenameRef = useRef<HTMLInputElement>(null)
  const downloadRef = useRef<HTMLAnchorElement & HTMLButtonElement>(null)

  const confirmDisabled = downloadFilename.length === 0 || !gotContent

  const completeDownload = () => {
    const newMetadata = new CloudMetadata({
      name: downloadFilename.split('.')[0],
      type: CloudMetadata.File,
      provider
    })
    dialog.callback(newMetadata)
    close()
  }

  const handleIOSSave = async (blob: Blob) => {
    const handled = await handleIOSDownload(blob, downloadFilename)
    if (!handled) {
      // Fall back to standard saveAs if iOS handling failed
      saveAs(blob, downloadFilename, { autoBom: true })
    }
    completeDownload()
  }

  const confirm = (e: MouseEvent | null, simulateClick: boolean) => {
    if (confirmDisabled) {
      e?.preventDefault()
      return
    }

    // Lazily create blob only when needed (not needed for browsers with download attribute support)
    const getBlob = () => client.getDownloadBlob(content, includeShareInfo, mimeType)

    // Handle iOS Safari specially due to blob URL bugs in iOS 18.2+
    if (isIOSSafari()) {
      e?.preventDefault()
      handleIOSSave(getBlob())
      return false
    }

    // Standard download handling for other browsers
    if (supportsDownloadAttribute) {
      if (downloadRef.current) {
        downloadRef.current.href = client.getDownloadUrl(content, includeShareInfo, mimeType)
      }
      if (simulateClick) {
        downloadRef.current?.click()
      }
    } else {
      saveAs(getBlob(), downloadFilename, { autoBom: true })
      e?.preventDefault()
    }

    completeDownload()

    // return value indicates whether to trigger href
    return supportsDownloadAttribute
  }

  // Wrapper for DOM event listener (passes event, no simulateClick)
  const handleClickEvent = (e: MouseEvent) => confirm(e, false)

  useEffect(() => {
    if (!hasPropsContent) {
      client._event('getContent', { shared: client._sharedMetadata() }, (receivedContent: any) => {
        const envelopedContent = cloudContentFactory.createEnvelopedCloudContent(receivedContent)
        client.state?.currentContent?.copyMetadataTo(envelopedContent)
        setGotContent(true)
        setContent(envelopedContent)
      })
    }

    // Using the React onClick handler for the download button yielded odd behaviors
    // in which the onClick handler got triggered multiple times and the default
    // handler could not be prevented, presumably due to React's SyntheticEvent system.
    // The solution here is to use standard browser event handlers.
    const downloadEl = downloadRef.current
    if (downloadEl) {
      downloadEl.addEventListener('click', handleClickEvent)
      return () => {
        downloadEl.removeEventListener('click', handleClickEvent)
      }
    }
  })

  const handleFilenameChange = () => {
    const newFilename = filenameRef.current?.value ?? ''
    setFilename(newFilename)
    setDownloadFilename(getDownloadFilename(hasPropsContent, newFilename, extension))
  }

  const handleIncludeShareInfoChange = () => {
    setIncludeShareInfo(prev => !prev)
  }

  const handleContextMenu = () => {
    if (downloadRef.current) {
      downloadRef.current.href = client.getDownloadUrl(content, includeShareInfo, mimeType)
    }
  }

  const handleCancel = () => {
    close()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode === 13 && !confirmDisabled) {
      e.preventDefault()
      e.stopPropagation()
      confirm(null, true)
    }
  }

  // for modern browsers
  const downloadAnchor = (
    <a
      href="#"
      ref={downloadRef as React.RefObject<HTMLAnchorElement>}
      className={confirmDisabled ? 'disabled' : ''}
      download={downloadFilename}
      onContextMenu={handleContextMenu}
    >
      {tr('~FILE_DIALOG.DOWNLOAD')}
    </a>
  )

  // for Safari (or other non-modern browsers)
  const downloadButton = (
    <button
      ref={downloadRef as React.RefObject<HTMLButtonElement>}
      className={confirmDisabled ? 'disabled' : ''}
    >
      {tr('~FILE_DIALOG.DOWNLOAD')}
    </button>
  )

  return (
    <div className="dialogTab localFileSave">
      <input
        type="text"
        ref={filenameRef}
        value={filename}
        placeholder={tr("~FILE_DIALOG.FILENAME")}
        onChange={handleFilenameChange}
        onKeyDown={handleKeyDown}
      />
      <div className="saveArea">
        {shared && !hasPropsContent && (
          <div className="shareCheckbox">
            <input
              type="checkbox"
              checked={includeShareInfo}
              onChange={handleIncludeShareInfoChange}
            />
            {tr('~DOWNLOAD_DIALOG.INCLUDE_SHARE_INFO')}
          </div>
        )}
      </div>
      <div className="buttons">
        {supportsDownloadAttribute ? downloadAnchor : downloadButton}
        <button onClick={handleCancel}>{tr("~FILE_DIALOG.CANCEL")}</button>
      </div>
    </div>
  )
}

export default LocalFileSaveTab
