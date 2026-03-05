import React, { useState, useEffect, useRef, useCallback } from 'react'
import { CFMUIMenuOptions } from '../app-options'
import tr, { getCurrentLanguage, getSpecialLangFontClassName } from '../utils/translate'
import DropdownView from './dropdown-view'
import { ProviderInterface } from '../providers/provider-interface'

interface FileStatus {
  type: string
  message: string
}

interface MenuBarProps {
  client: {
    appOptions: {
      appIcon?: string
      ui: {
        menuBar?: {
          subMenuExpandIcon?: string
        }
      }
    }
    _ui: {
      menu: {
        options?: {
          menuAnchorIcon?: string
          menuAnchorName?: string
        }
      }
      listen: (callback: (event: any) => void) => void
    }
    state: {
      metadata?: any
    }
    setInitialFilename: (filename: string) => void
    rename: (metadata: any, filename: string) => void
    changeLanguage: (langCode: string, callback: () => void) => void
  }
  provider?: ProviderInterface
  options: {
    clientToolBarPosition?: string
    info?: string
    languageMenu?: {
      options: Array<{
        langCode: string
        label?: string
        flag?: string
      }>
      withBorder?: boolean
      onLangChanged?: () => void
    }
    languageAnchorIcon?: string
    otherMenus?: CFMUIMenuOptions[]
    onInfoClick?: () => void
  }
  items: any[]
  filename?: string
  fileStatus?: FileStatus
}

const MenuBar: React.FC<MenuBarProps> = ({
  client,
  provider,
  options,
  items,
  filename: propFilename,
  fileStatus
}) => {
  const getFilename = (fname?: string) => {
    return fname && fname.length > 0 ? fname : tr("~MENUBAR.UNTITLED_DOCUMENT")
  }

  const [editingFilename, setEditingFilename] = useState(false)
  const [editingInitialFilename, setEditingInitialFilename] = useState(false)
  const [filename, setFilename] = useState(() => getFilename(propFilename))
  const [editableFilename, setEditableFilename] = useState(() => getFilename(propFilename))
  const [initialEditableFilename] = useState(() => getFilename(propFilename))

  const filenameRef = useRef<HTMLInputElement>(null)

  // Update filename when prop changes
  useEffect(() => {
    const newFilename = getFilename(propFilename)
    setFilename(newFilename)
    setEditableFilename(newFilename)
  }, [propFilename])

  const focusFilename = useCallback(() => {
    const el = filenameRef.current
    if (el) {
      el.focus()
      el.select()
    }
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingFilename(false)
    setEditableFilename(filename.length > 0 ? filename : initialEditableFilename)
  }, [filename, initialEditableFilename])

  const rename = useCallback(() => {
    const trimmedFilename = editableFilename.replace(/^\s+|\s+$/, '')
    if (trimmedFilename.length > 0) {
      if (editingInitialFilename) {
        client.setInitialFilename(trimmedFilename)
      } else {
        client.rename(client.state.metadata, trimmedFilename)
      }
      setEditingFilename(false)
      setFilename(trimmedFilename)
      setEditableFilename(trimmedFilename)
    } else {
      cancelEdit()
    }
  }, [editableFilename, editingInitialFilename, client, cancelEdit])

  const filenameBlurred = useCallback(() => {
    rename()
  }, [rename])

  // CODAP eats the click events in the main workspace which causes the blur event not to fire
  // so we need to check for a non-bubbling global click event when editing
  const checkBlur = useCallback((e: MouseEvent | TouchEvent) => {
    if (editingFilename && e.target !== filenameRef.current) {
      filenameBlurred()
    }
  }, [editingFilename, filenameBlurred])

  useEffect(() => {
    // need to use direct DOM events because the event needs to be captured
    window.addEventListener('mousedown', checkBlur, true)
    window.addEventListener('touchstart', checkBlur, true)

    client._ui.listen((event: any) => {
      if (event.type === 'editInitialFilename') {
        setEditingFilename(true)
        setEditingInitialFilename(true)
        setTimeout(() => focusFilename(), 10)
      }
    })

    return () => {
      window.removeEventListener('mousedown', checkBlur, true)
      window.removeEventListener('touchstart', checkBlur, true)
    }
  }, [checkBlur, client._ui, focusFilename])

  const filenameClicked = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingFilename(true)
    setEditingInitialFilename(false)
    setTimeout(() => focusFilename(), 10)
  }

  const filenameChanged = () => {
    if (filenameRef.current) {
      setEditableFilename(filenameRef.current.value)
    }
  }

  const watchForEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode === 13) {
      rename()
    } else if (e.keyCode === 27) {
      cancelEdit()
    }
  }

  const infoClicked = () => {
    options.onInfoClick?.()
  }

  const langChanged = (langCode: string) => {
    const { onLangChanged } = options.languageMenu ?? {}
    if (onLangChanged) {
      client.changeLanguage(langCode, onLangChanged)
    }
  }

  const renderLanguageMenu = () => {
    const langMenu = options.languageMenu
    if (!langMenu) return null

    const currentLang = getCurrentLanguage()
    const langClass = getSpecialLangFontClassName(currentLang)
    const menuItems = langMenu.options
      // Do not show current language in the menu.
      .filter((option) => currentLang !== option.langCode)
      .map((option) => {
        let className
        const label = option.label || option.langCode.toUpperCase()
        if (option.flag) { className = `flag flag-${option.flag}` }
        return {
          content: <span className="lang-option"><div className={className} />{label}</span>,
          action: () => langChanged(option.langCode)
        }
      })

    const hasFlags = langMenu.options.filter((option) => option.flag != null).length > 0
    const currentOption = langMenu.options.filter((option) => currentLang === option.langCode)[0]
    const defaultOption = hasFlags ? { flag: "us" } : { label: "English" }
    const { flag, label } = currentOption || defaultOption
    const withBorder = langMenu.withBorder ? 'with-border' : ''
    const menuAnchor = flag ? (
      <div className={`flag flag-${flag}`} />
    ) : (
      <button className={`menu-bar-button lang-menu-button ${withBorder} ${langClass}`}>
        <img className="menu-icon lang-icon" src={options.languageAnchorIcon} alt="Language Icon" />
        <span className="lang-label">{label || defaultOption.label}</span>
      </button>
    )

    return (
      <DropdownView
        className="lang-menu"
        menuAnchorClassName="menu-anchor-right"
        items={menuItems}
        menuAnchor={menuAnchor}
      />
    )
  }

  const renderFileMenu = () => {
    const currentLang = getCurrentLanguage()
    const langClass = getSpecialLangFontClassName(currentLang)
    const menuBarOptions = client.appOptions.ui.menuBar || {}
    const menuOptions = client._ui.menu.options || {}
    const fileMenuAnchor = (
      <button className={`menu-bar-button file-menu-button ${langClass}`}>
        <img className="menu-icon" src={menuOptions.menuAnchorIcon} alt="Menu Icon" />
        <span className="menu-label">{menuOptions.menuAnchorName}</span>
      </button>
    )

    return (
      <DropdownView
        items={items}
        menuAnchor={fileMenuAnchor}
        subMenuExpandIcon={menuBarOptions.subMenuExpandIcon}
      />
    )
  }

  const renderOtherMenu = (menuOptions: CFMUIMenuOptions) => {
    const currentLang = getCurrentLanguage()
    const langClass = getSpecialLangFontClassName(currentLang)
    const menuBarOptions = client.appOptions.ui.menuBar || {}
    const menuAnchor = (
      <button className={`menu-bar-button other-menu-button ${langClass}`}>
        <img className="menu-icon" src={menuOptions.menuAnchorIcon} alt="Menu Icon" />
        <span className="menu-label">{menuOptions.menuAnchorName}</span>
      </button>
    )
    const menuKey = `other-menu-${menuOptions.className || ''}-${menuOptions.menuAnchorName || ''}`

    return (
      <DropdownView
        key={menuKey}
        items={(menuOptions.menu ?? []) as any}
        menuAnchor={menuAnchor}
        className={menuOptions.className}
        subMenuExpandIcon={menuBarOptions.subMenuExpandIcon}
      />
    )
  }

  const currentLang = getCurrentLanguage()
  console.log(`MenuBar: current language is ${currentLang}`)
  const langClass = getSpecialLangFontClassName(currentLang)
  // Note: authorized() is typed as void but actually returns a boolean when called without a callback
  const providerAny = provider as any
  const isAuthorized = provider && provider.isAuthorizationRequired() && providerAny.authorized()

  return (
    <div className={`menu-bar ${options.clientToolBarPosition === "left" ? 'toolbar-position-left' : ''} ${langClass}`}>
      <div className="menu-bar-left">
        {renderFileMenu()}
        <div className={`menu-bar-content-filename ${langClass}`}>
          {editingFilename ? (
            <input
              ref={filenameRef}
              value={editableFilename}
              onChange={filenameChanged}
              onKeyDown={watchForEnter}
              onMouseEnter={(e) => e.stopPropagation()}
              onMouseMove={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="content-filename" onClick={filenameClicked}>{filename}</span>
          )}
          {fileStatus && (
            <span className={`menu-bar-file-status ${fileStatus.type} ${langClass}`}>{fileStatus.message}</span>
          )}
        </div>
      </div>
      <div className="menu-bar-center">
        <img className="app-logo" src={client.appOptions.appIcon} alt="CODAP Logo" onClick={infoClicked} />
        {options.info && (
          <span className="menu-bar-info">{options.info}</span>
        )}
      </div>
      <div className="menu-bar-right">
        {isAuthorized && provider?.renderUser()}
        {options.otherMenus?.map((menuOptions) => renderOtherMenu(menuOptions))}
        {options.languageMenu && renderLanguageMenu()}
      </div>
    </div>
  )
}

export default MenuBar
