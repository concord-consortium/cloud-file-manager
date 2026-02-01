import React, { useState, useEffect, useRef, useCallback } from 'react'
import $ from 'jquery'
import { DefaultAnchor } from './dropdown-anchors'
import { getCurrentLanguage, getSpecialLangFontClassName } from '../utils/translate'

interface DropdownItemData {
  name?: string
  content?: React.ReactNode
  icon?: string
  separator?: boolean
  enabled?: boolean | (() => boolean)
  action?: () => void
  items?: DropdownItemData[]
}

interface SubMenuState {
  style: React.CSSProperties
  items: DropdownItemData[]
}

interface DropdownItemProps {
  item: DropdownItemData
  select: (item: DropdownItemData | null) => void
  setSubMenu?: (subMenu: SubMenuState | null) => void
  subMenuExpandIcon?: string
}

const DropdownItem: React.FC<DropdownItemProps> = ({ item, select, setSubMenu, subMenuExpandIcon }) => {
  const itemRef = useRef<HTMLLIElement>(null)

  const showSubMenu = useCallback(() => {
    if (item.items) {
      const domNode = itemRef.current
      if (!domNode) return
      const menuItem = $(domNode)
      const menu = menuItem.parent().parent()

      setSubMenu?.({
        style: {
          position: 'absolute',
          left: menu.width() ?? 0,
          top: (menuItem.position()?.top ?? 0) - parseInt(menuItem.css('padding-top'), 10)
        },
        items: item.items
      })
    } else {
      setSubMenu?.(null)
    }
  }, [item, setSubMenu])

  const handleClick = () => {
    if (item.items) {
      showSubMenu()
    } else {
      select(item)
    }
  }

  const handleMouseEnter = () => {
    showSubMenu()
  }

  const enabled = item.enabled != null
    ? typeof item.enabled === 'function'
      ? item.enabled()
      : item.enabled
    : true

  const classes = ['menuItem']
  const currentLang = getCurrentLanguage()
  const langClass = getSpecialLangFontClassName(currentLang)

  if (item.separator) {
    classes.push('separator')
    return <li className={classes.join(' ')}></li>
  }

  if (!enabled || !(item.action || item.items)) {
    classes.push('disabled')
  }

  const content = item.name || item.content || item

  return (
    <li
      ref={itemRef}
      className={classes.join(' ')}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      {item.icon && (
        <img className="menu-list-icon" src={item.icon} alt={item.name} />
      )}
      <span className={`menu-item-content ${langClass}`}>{content as React.ReactNode}</span>
      {item.items && (
        <img className="submenu-list-arrow" src={subMenuExpandIcon} />
      )}
    </li>
  )
}

const cfmMenuClass = 'cfm-menu dg-wants-touch'
const cfmOpenMenuClassSelector = '.cfm-menu.dg-wants-touch.menu-showing'

interface DropdownProps {
  items?: DropdownItemData[]
  className?: string
  menuAnchorClassName?: string
  menuAnchor?: React.ReactNode
  subMenuExpandIcon?: string
}

const Dropdown: React.FC<DropdownProps> = ({
  items,
  className,
  menuAnchorClassName,
  menuAnchor,
  subMenuExpandIcon
}) => {
  const [showingMenu, setShowingMenu] = useState(false)
  const [subMenu, setSubMenu] = useState<SubMenuState | null>(null)

  useEffect(() => {
    const checkClose = (evt: MouseEvent | TouchEvent) => {
      if (!showingMenu) return
      // if the click is inside the open menu, do nothing
      if (evt.target instanceof Element) {
        const openMenuParent = evt.target.closest(cfmOpenMenuClassSelector)
        if (openMenuParent) return
      }
      // otherwise, close the menu
      setShowingMenu(false)
      setSubMenu(null)
    }

    const handleKeyDown = (evt: KeyboardEvent) => {
      if (showingMenu && evt.key === 'Escape') {
        setShowingMenu(false)
        setSubMenu(null)
      }
    }

    window.addEventListener('mousedown', checkClose, true)
    window.addEventListener('touchstart', checkClose, true)
    window.addEventListener('keydown', handleKeyDown, true)

    return () => {
      window.removeEventListener('mousedown', checkClose, true)
      window.removeEventListener('touchstart', checkClose, true)
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [showingMenu])

  const handleSetSubMenu = (newSubMenu: SubMenuState | null) => {
    setSubMenu(newSubMenu)
  }

  const select = (item: DropdownItemData | null) => {
    if (item?.items) return
    setShowingMenu(!showingMenu)
    if (!item) return
    item.action?.()
  }

  const currentLang = getCurrentLanguage()
  const langClass = getSpecialLangFontClassName(currentLang)
  const menuClass = `${cfmMenuClass} ${showingMenu ? 'menu-showing' : 'menu-hidden'}`
  const dropdownClass = `menu ${className || ''} ${showingMenu ? 'menu-open' : 'menu-close'}`
  const menuAnchorClassFull = `menu-anchor ${menuAnchorClassName || ''}`

  return (
    <div className={dropdownClass}>
      {items && items.length > 0 && (
        <div>
          <div
            className={`${cfmMenuClass} ${menuAnchorClassFull} ${langClass}`}
            onClick={() => select(null)}
          >
            {menuAnchor || DefaultAnchor}
          </div>
          <div className={menuClass}>
            <ul className="menu-list-container">
              {items.map((item, index) => (
                <DropdownItem
                  key={index}
                  item={item}
                  select={select}
                  setSubMenu={handleSetSubMenu}
                  subMenuExpandIcon={subMenuExpandIcon}
                />
              ))}
            </ul>
            {subMenu && (
              <div className={`${menuClass} sub-menu`} style={subMenu.style}>
                <ul>
                  {subMenu.items.map((item, index) => (
                    <DropdownItem
                      key={index}
                      item={item}
                      select={select}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dropdown
