import React from 'react'
import {
  Button, MenuTrigger, Menu, MenuItem, Popover, Separator, SubmenuTrigger
} from 'react-aria-components'
import type { Key } from 'react-aria-components'
import { DefaultAnchor } from './dropdown-anchors'
import { getCurrentLanguage, getSpecialLangFontClassName } from '../utils/translate'
import { sanitizeMenuItemKey } from '../utils/testids'

export interface DropdownItemData {
  name?: string
  content?: React.ReactNode
  icon?: string
  separator?: boolean
  enabled?: boolean | (() => boolean)
  action?: () => void
  items?: DropdownItemData[]
  key?: string
  testId?: string
}

interface DropdownProps {
  items?: DropdownItemData[]
  className?: string
  triggerClassName?: string
  menuAnchor?: React.ReactNode
  subMenuExpandIcon?: string
  triggerProps?: Record<string, string | boolean>
  menuName?: string
  triggerTestId?: string
  menuListTestId?: string
  customMenuItems?: boolean
}

function isEnabled(item: DropdownItemData): boolean {
  if (item.enabled == null) return true
  return typeof item.enabled === 'function' ? item.enabled() : item.enabled
}

const getMenuItemTestId = (item: DropdownItemData, menuName?: string, customMenuItems?: boolean) => {
  if (item.separator) return undefined
  if (item.testId) {
    if (customMenuItems && !item.testId.startsWith('cfm-menuitem-custom-')) {
      return item.testId.startsWith('cfm-') ? item.testId : `cfm-menuitem-custom-${item.testId}`
    }
    return item.testId
  }
  const key = item.key || item.name || ''
  if (customMenuItems) {
    return `cfm-menuitem-custom-${sanitizeMenuItemKey(key)}`
  }
  if (menuName && key) {
    return `cfm-menuitem-${menuName}-${sanitizeMenuItemKey(key)}`
  }
  return undefined
}

const getSubMenuName = (item: DropdownItemData, fallbackMenuName?: string) => {
  if (item.key) {
    return sanitizeMenuItemKey(item.key.replace(/SubMenu$/, ''))
  }
  return fallbackMenuName
}

function renderMenuItems(items: DropdownItemData[], subMenuExpandIcon?: string, menuName?: string, customMenuItems?: boolean) {
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

    const menuItemTestId = getMenuItemTestId(item, menuName, customMenuItems)

    if (item.items) {
      const subMenuName = getSubMenuName(item, menuName)
      const subMenuTestId = subMenuName ? `cfm-submenu-${subMenuName}` : undefined
      return (
        <SubmenuTrigger key={index}>
          <MenuItem
            className={`menuItem ${disabled ? 'disabled' : ''}`}
            isDisabled={disabled}
            data-testid={menuItemTestId}
          >
            {item.icon && <img className="menu-list-icon" src={item.icon} alt={item.name} />}
            <span className={`menu-item-content ${langClass}`}>{content as React.ReactNode}</span>
            {subMenuExpandIcon && <img className="submenu-list-arrow" src={subMenuExpandIcon} />}
          </MenuItem>
          <Popover className="sub-menu cfm-menu dg-wants-touch menu-showing" data-testid={subMenuTestId}>
            <Menu className="menu-list-container" onAction={(key: Key) => {
              const subItem = item.items?.[Number(key)]
              subItem?.action?.()
            }}>
              {renderMenuItems(item.items, subMenuExpandIcon, subMenuName, customMenuItems)}
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
        data-testid={menuItemTestId}
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
  subMenuExpandIcon,
  triggerProps,
  menuName,
  triggerTestId,
  menuListTestId,
  customMenuItems
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
        <Button
          className={`menu-anchor cfm-menu dg-wants-touch ${triggerClassName || ''} ${langClass}`}
          data-testid={triggerTestId}
          {...triggerProps}
        >
          {menuAnchor || DefaultAnchor}
        </Button>
        <Popover className="cfm-menu dg-wants-touch menu-showing" offset={0}>
          <Menu
            className="menu-list-container"
            data-testid={menuListTestId}
            onAction={handleAction}
          >
            {renderMenuItems(items, subMenuExpandIcon, menuName, customMenuItems)}
          </Menu>
        </Popover>
      </MenuTrigger>
    </div>
  )
}

export default Dropdown
