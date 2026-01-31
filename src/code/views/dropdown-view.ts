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
      this.showSubMenu()
    } else {
      this.props.select(this.props.item)
    }
  },

  mouseEnter() {
    this.showSubMenu()
  },

  showSubMenu() {
    if (this.props.item.items) {
      const domNode = ReactDOM.findDOMNode(this.itemRef) as Element | null
      if (!domNode) return
      const menuItem = $(domNode)
      const menu = menuItem.parent().parent()

      this.props.setSubMenu({
        style: {
          position: 'absolute',
          left: menu.width(),
          top: menuItem.position().top - parseInt(menuItem.css('padding-top'), 10)
        },
        items: this.props.item.items
      })
    } else {
      this.props.setSubMenu?.(null)
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
      return (li({ref: ((elt: any) => { this.itemRef = elt }), className: classes.join(' '), onClick: this.clicked, onMouseEnter: this.mouseEnter },
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

  checkClose(evt: MouseEvent | TouchEvent) {
    if (!this.state.showingMenu) { return }
    // if the click is inside the open menu, do nothing
    if (evt.target instanceof Element) {
      const openMenuParent = evt.target.closest(cfmOpenMenuClassSelector)
      if (openMenuParent) return
    }
    // otherwise, close the menu
    this.setState({showingMenu: false, subMenu: false})
  },

  handleKeyDown(evt: KeyboardEvent) {
    if (this.state.showingMenu && evt.key === 'Escape') {
      this.setState({ showingMenu: false, subMenu: false })
    }
  },

  setSubMenu(subMenu: any) {
    this.setState({subMenu})
  },

  select(item: any) {
    if (item?.items) { return }
    const nextState = (!this.state.showingMenu)
    this.setState({showingMenu: nextState})
    if (!item) { return }
    item.action?.()
  },

  render() {
    const currentLang = getCurrentLanguage()
    const langClass = getSpecialLangFontClassName(currentLang)
    const menuClass = `${cfmMenuClass} ${this.state.showingMenu ? 'menu-showing' : 'menu-hidden'}`
    const dropdownClass = `menu ${this.props.className || ''} ${this.state.showingMenu ? 'menu-open' : 'menu-close'}`
    const menuAnchorClass = `menu-anchor ${this.props.menuAnchorClassName || ''}`
    return (div({className: dropdownClass},
      this.props.items?.length > 0 ?
        (div({},
          (div({className: `${cfmMenuClass} ${menuAnchorClass} ${langClass}`, onClick: () => this.select(null)},
            this.props.menuAnchor || DefaultAnchor
          )),
          (div({className: menuClass},
            (ul({className: 'menu-list-container'},
              this.props.items.map((item: any, index: number) =>
                DropdownItem({key: index, item, select: this.select, setSubMenu: this.setSubMenu,
                  subMenuExpandIcon: this.props.subMenuExpandIcon})
              )
            )),
            this.state.subMenu ?
              (div({className: `${menuClass} sub-menu`, style: this.state.subMenu.style},
                (ul({},
                  this.state.subMenu.items.map((item: any, index: number) =>
                    DropdownItem({key: index, item, select: this.select})
                  )
                ))
              )) : undefined
          ))
      )) : undefined
    ))
  }
})

export default DropDown
