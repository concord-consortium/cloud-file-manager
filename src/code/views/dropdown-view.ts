// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import $ from 'jquery'
import createReactClass from 'create-react-class'
import ReactDOM from 'react-dom'
import ReactDOMFactories from 'react-dom-factories'
import { createReactClassFactory } from '../create-react-factory'
import { DefaultAnchor } from './dropdown-anchors'
import { getCurrentLanguage, getSpecialLangFontClassName } from '../utils/translate'

const {div, img, ul, li, span} = ReactDOMFactories

const DropdownItem = createReactClassFactory({
  displayName: 'DropdownItem',

  clicked() {
    if (this.props.item.items) {
      return this.showSubMenu()
    } else {
      return this.props.select(this.props.item)
    }
  },

  mouseEnter() {
    return this.showSubMenu()
  },

  showSubMenu() {
    if (this.props.item.items) {
      const menuItem = $(ReactDOM.findDOMNode(this.itemRef))
      const menu = menuItem.parent().parent()

      return this.props.setSubMenu({
        style: {
          position: 'absolute',
          left: menu.width(),
          top: menuItem.position().top - parseInt(menuItem.css('padding-top'), 10)
        },
        items: this.props.item.items
      })
    } else {
      return (typeof this.props.setSubMenu === 'function' ? this.props.setSubMenu(null) : undefined)
    }
  },

  render() {
    const enabled = this.props.item.enabled != null
                      ? typeof this.props.item.enabled === 'function'
                        ? this.props.item.enabled()
                        : this.props.item.enabled
                      : true

    const classes = ['menuItem']
    const currentLang = getCurrentLanguage()
    const langClass = getSpecialLangFontClassName(currentLang)
    if (this.props.item.separator) {
      classes.push('separator')
      return (li({className: classes.join(' ')}, ''))
    } else {
      if (!enabled || !(this.props.item.action || this.props.item.items)) { classes.push('disabled') }
      const content = this.props.item.name || this.props.item.content || this.props.item
      return (li({ref: ((elt: any) => { return this.itemRef = elt }), className: classes.join(' '), onClick: this.clicked, onMouseEnter: this.mouseEnter },
        this.props.item.icon && (img({className: 'menu-list-icon', src: this.props.item.icon, alt: this.props.item.name})),
        (span({className: `menu-item-content ${langClass}`}, content)),
        this.props.item.items ?
          (img({className: `submenu-list-arrow`, src: this.props.subMenuExpandIcon})) : undefined,
      ))
    }
  }
})

const cfmMenuClass = 'cfm-menu dg-wants-touch'
const cfmOpenMenuClassSelector = '.cfm-menu.dg-wants-touch.menu-showing'

const DropDown = createReactClass({

  displayName: 'Dropdown',

  getInitialState() {
    return {
      showingMenu: false,
      subMenu: null
    }
  },

  componentDidMount() {
    if (window.addEventListener) {
      window.addEventListener('mousedown', this.checkClose, true)
      window.addEventListener('touchstart', this.checkClose, true)
      window.addEventListener('keydown', this.handleKeyDown, true)
    }
  },

  componentWillUnmount() {
    if (window.removeEventListener) {
      window.removeEventListener('mousedown', this.checkClose, true)
      window.removeEventListener('touchstart', this.checkClose, true)
      window.removeEventListener('keydown', this.handleKeyDown, true)
    }
  },

  checkClose(evt: any) {
    if (!this.state.showingMenu) { return }
    // if the click is inside the open menu, do nothing
    if (evt.target instanceof Element) {
      const openMenuParent = evt.target.closest(cfmOpenMenuClassSelector)
      if (openMenuParent) return
    }
    // otherwise, close the menu
    return this.setState({showingMenu: false, subMenu: false})
  },

  handleKeyDown(evt: KeyboardEvent) {
    if (this.state.showingMenu && evt.key === 'Escape') {
      this.setState({ showingMenu: false, subMenu: false })
    }
  },

  setSubMenu(subMenu: any) {
    return this.setState({subMenu})
  },

  select(item: any) {
    if (item != null ? item.items : undefined) { return }
    const nextState = (!this.state.showingMenu)
    this.setState({showingMenu: nextState})
    if (!item) { return }
    return (typeof item.action === 'function' ? item.action() : undefined)
  },

  render() {
    let index, item
    const currentLang = getCurrentLanguage()
    const langClass = getSpecialLangFontClassName(currentLang)
    const menuClass = `${cfmMenuClass} ${this.state.showingMenu ? 'menu-showing' : 'menu-hidden'}`
    const dropdownClass = `menu ${this.props.className ? this.props.className : ''} ${this.state.showingMenu ? 'menu-open' : 'menu-close'}`
    const menuAnchorClass = `menu-anchor ${this.props.menuAnchorClassName ? this.props.menuAnchorClassName : ''}`
    return (div({className: dropdownClass},
      (this.props.items != null ? this.props.items.length : undefined) > 0 ?
        (div({},
          (div({className: `${cfmMenuClass} ${menuAnchorClass} ${langClass}`, onClick: () => this.select(null)},
            this.props.menuAnchor ?
              this.props.menuAnchor
            :
              DefaultAnchor
          )),
          (div({className: menuClass},
            (ul({className: 'menu-list-container'},
              (() => {
              const result = []
              for (index = 0; index < this.props.items.length; index++) {
                item = this.props.items[index]
                result.push((DropdownItem({key: index, item, select: this.select, setSubMenu: this.setSubMenu,
                      subMenuExpandIcon: this.props.subMenuExpandIcon})))
              }
              return result
            })()
            )),
            this.state.subMenu ?
              (div({className: `${menuClass} sub-menu`, style: this.state.subMenu.style},
                (ul({},
                  (() => {
                  const result1 = []
                  for (index = 0; index < this.state.subMenu.items.length; index++) {
                    item = this.state.subMenu.items[index]
                    result1.push((DropdownItem({key: index, item, select: this.select})))
                  }
                  return result1
                })()
                ))
              )) : undefined
          ))
      )) : undefined
    ))
  }
})

export default DropDown
