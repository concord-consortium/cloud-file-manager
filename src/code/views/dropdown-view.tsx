import React from 'react'
import {
  Button, MenuTrigger, Menu, MenuItem, Popover, Separator, SubmenuTrigger
} from 'react-aria-components'
import type { Key } from 'react-aria-components'
import { DefaultAnchor } from './dropdown-anchors'
import { getCurrentLanguage, getSpecialLangFontClassName } from '../utils/translate'

export interface DropdownItemData {
  name?: string
  content?: React.ReactNode
  icon?: string
  separator?: boolean
  enabled?: boolean | (() => boolean)
  action?: () => void
  items?: DropdownItemData[]
}

interface DropdownProps {
  items?: DropdownItemData[]
  className?: string
  triggerClassName?: string
  menuAnchor?: React.ReactNode
  subMenuExpandIcon?: string
}

function isEnabled(item: DropdownItemData): boolean {
  if (item.enabled == null) return true
  return typeof item.enabled === 'function' ? item.enabled() : item.enabled
}

function renderMenuItems(items: DropdownItemData[], subMenuExpandIcon?: string) {
  const currentLang = getCurrentLanguage()
  const langClass = getSpecialLangFontClassName(currentLang)

  return items.map((item, index) => {
    if (item.separator) {
      return <Separator key={index} className="menuItem separator" />
    }

    const enabled = isEnabled(item)
    const hasAction = !!(item.action || item.items)
    const disabled = !enabled || !hasAction
    const content = item.name || item.content || ''

    if (item.items) {
      return (
        <SubmenuTrigger key={index}>
          <MenuItem
            className={`menuItem ${disabled ? 'disabled' : ''}`}
            isDisabled={disabled}
          >
            {item.icon && <img className="menu-list-icon" src={item.icon} alt={item.name} />}
            <span className={`menu-item-content ${langClass}`}>{content as React.ReactNode}</span>
            {subMenuExpandIcon && <img className="submenu-list-arrow" src={subMenuExpandIcon} />}
          </MenuItem>
          <Popover className="sub-menu cfm-menu dg-wants-touch menu-showing">
            <Menu className="menu-list-container" onAction={(key: Key) => {
              const subItem = item.items?.[key as number]
              subItem?.action?.()
            }}>
              {renderMenuItems(item.items, subMenuExpandIcon)}
            </Menu>
          </Popover>
        </SubmenuTrigger>
      )
    }

    return (
      <MenuItem
        key={index}
        id={index}
        className={`menuItem ${disabled ? 'disabled' : ''}`}
        isDisabled={disabled}
      >
        {item.icon && <img className="menu-list-icon" src={item.icon} alt={item.name} />}
        <span className={`menu-item-content ${langClass}`}>{content as React.ReactNode}</span>
      </MenuItem>
    )
  })
}

const Dropdown: React.FC<DropdownProps> = ({
  items,
  className,
  triggerClassName,
  menuAnchor,
  subMenuExpandIcon
}) => {
  const dropdownClass = `menu ${className || ''}`
  const currentLang = getCurrentLanguage()
  const langClass = getSpecialLangFontClassName(currentLang)

  if (!items || items.length === 0) {
    return <div className={dropdownClass} />
  }

  const handleAction = (key: Key) => {
    const item = items[Number(key)]
    item?.action?.()
  }

  return (
    <div className={dropdownClass}>
      <MenuTrigger>
        <Button className={`menu-anchor cfm-menu dg-wants-touch ${triggerClassName || ''} ${langClass}`}>
          {menuAnchor || DefaultAnchor}
        </Button>
        <Popover className="cfm-menu dg-wants-touch menu-showing">
          <Menu className="menu-list-container" onAction={handleAction}>
            {renderMenuItems(items, subMenuExpandIcon)}
          </Menu>
        </Popover>
      </MenuTrigger>
    </div>
  )
}

export default Dropdown
