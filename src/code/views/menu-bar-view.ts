import createReactClass from "create-react-class"
import ReactDOM from "react-dom"
import ReactDOMFactories from "react-dom-factories"
import { CFMUIMenuOptions } from "../app-options"
import { createReactFactory } from "../create-react-factory"
import tr, { getCurrentLanguage, getSpecialLangFontClassName } from "../utils/translate"
import DropDownView from "./dropdown-view"

const {div, span, input, button, img} = ReactDOMFactories
const Dropdown = createReactFactory(DropDownView)

export default createReactClass({

  displayName: 'MenuBar',

  componentDidMount() {
    // need to use direct DOM events because the event needs to be captured
    if (window.addEventListener) {
      window.addEventListener('mousedown', this.checkBlur, true)
      window.addEventListener('touchstart', this.checkBlur, true)
    }

    this.props.client._ui.listen((event: any) => {
      if (event.type === 'editInitialFilename') {
        this.setState({
          editingFilename: true,
          editingInitialFilename: true
        })
        setTimeout(() => this.focusFilename(), 10)
      }
    })
  },

  componentWillUnmount() {
    if (window.removeEventListener) {
      window.removeEventListener('mousedown', this.checkBlur, true)
      window.removeEventListener('touchstart', this.checkBlur, true)
    }
  },

  getFilename(props: any) {
    return props.filename?.length > 0 ? props.filename : tr("~MENUBAR.UNTITLED_DOCUMENT")
  },

  getEditableFilename(props: any) {
    return props.filename?.length > 0 ? props.filename : tr("~MENUBAR.UNTITLED_DOCUMENT")
  },

  getInitialState() {
    return {
      editingFilename: false,
      filename: this.getFilename(this.props),
      editableFilename: this.getEditableFilename(this.props),
      initialEditableFilename: this.getEditableFilename(this.props),
      editingInitialFilename: false
    }
  },

  UNSAFE_componentWillReceiveProps(nextProps: any) {
    this.setState({
      filename: this.getFilename(nextProps),
      editableFilename: this.getEditableFilename(nextProps),
      provider: nextProps.provider
    })
  },

  filenameClicked(e: React.MouseEvent<HTMLSpanElement>) {
    e.preventDefault()
    e.stopPropagation()
    this.setState({
      editingFilename: true,
      editingInitialFilename: false
    })
    setTimeout(() => this.focusFilename(), 10)
  },

  filenameChanged() {
    this.setState({
      editableFilename: this.filename().value
    })
  },

  filenameBlurred() {
    this.rename()
  },

  filename() {
    return ReactDOM.findDOMNode(this.filenameRef)
  },

  focusFilename() {
    const el = this.filename()
    el.focus()
    el.select()
  },

  cancelEdit() {
    this.setState({
      editingFilename: false,
      editableFilename: this.state.filename?.length > 0 ? this.state.filename : this.state.initialEditableFilename
    })
  },

  rename() {
    const filename = this.state.editableFilename.replace(/^\s+|\s+$/, '')
    if (filename.length > 0) {
      if (this.state.editingInitialFilename) {
        this.props.client.setInitialFilename(filename)
      } else {
        this.props.client.rename(this.props.client.state.metadata, filename)
      }
      this.setState({
        editingFilename: false,
        filename,
        editableFilename: filename
      })
    } else {
      this.cancelEdit()
    }
  },

  watchForEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.keyCode === 13) {
      this.rename()
    } else if (e.keyCode === 27) {
      this.cancelEdit()
    }
  },

  infoClicked() {
    this.props.options.onInfoClick?.()
  },

  // CODAP eats the click events in the main workspace which causes the blur event not to fire so we need to check for a non-bubbling global click event when editing
  checkBlur(e: MouseEvent | TouchEvent) {
    if (this.state.editingFilename && (e.target !== this.filename())) {
      this.filenameBlurred()
    }
  },

  langChanged(langCode: string) {
    const {client, options} = this.props
    const {onLangChanged} = options.languageMenu
    if (onLangChanged) {
      client.changeLanguage(langCode, onLangChanged)
    }
  },

  renderLanguageMenu() {
    const {options} = this.props
    const langMenu = options.languageMenu
    const currentLang = getCurrentLanguage()
    const langClass = getSpecialLangFontClassName(currentLang)
    const items = langMenu.options
      // Do not show current language in the menu.
      .filter((option: any) => currentLang !== option.langCode)
      .map((option: any) => {
        let className
        const label = option.label || option.langCode.toUpperCase()
        if (option.flag) { className = `flag flag-${option.flag}` }
        return {
          content: (span({className: 'lang-option'}, (div({className})), label)),
          action: () => this.langChanged(option.langCode)
        }
      })

    const hasFlags = langMenu.options.filter((option: any) => option.flag != null).length > 0
    const currentOption = langMenu.options.filter((option: any) => currentLang === option.langCode)[0]
    const defaultOption = hasFlags ? {flag: "us"} : {label: "English"}
    const {flag, label} = currentOption || defaultOption
    const withBorder = langMenu.withBorder ? 'with-border' : ''
    const menuAnchor = flag ?
      (div({className: `flag flag-${flag}`}))
    :
      (button({className: `menu-bar-button lang-menu-button ${withBorder} ${langClass}`},
        (img({className: 'menu-icon lang-icon', src: options.languageAnchorIcon, alt: "Language Icon"})),
        (span({className: "lang-label"}, label || defaultOption.label)),
      ))

    return (Dropdown({
      className: "lang-menu",
      menuAnchorClassName: "menu-anchor-right",
      items,
      menuAnchor
    }))
  },

  renderFileMenu() {
    const { client } = this.props
    const currentLang = getCurrentLanguage()
    const langClass = getSpecialLangFontClassName(currentLang)
    const menuBarOptions = client.appOptions.ui.menuBar || {}
    const menuOptions = client._ui.menu.options || []
    const fileMenuAnchor =
      (button({ref: (el: any) => { this.fileMenuButtonRef = el }, className: `menu-bar-button file-menu-button ${langClass}`},
          (img({className: 'menu-icon', src: menuOptions.menuAnchorIcon, alt: "Menu Icon"})),
          (span({className: "menu-label"}, menuOptions.menuAnchorName))
      ))

    return (Dropdown({items: this.props.items, menuAnchor: fileMenuAnchor,
      subMenuExpandIcon: menuBarOptions.subMenuExpandIcon}))
  },

  renderOtherMenu(options: CFMUIMenuOptions) {
    const { client } = this.props
    const currentLang = getCurrentLanguage()
    const langClass = getSpecialLangFontClassName(currentLang)
    const menuBarOptions = client.appOptions.ui.menuBar || {}
    const menuAnchor =
      (button({className: `menu-bar-button other-menu-button ${langClass}`},
          (img({className: 'menu-icon', src: options.menuAnchorIcon, alt: "Menu Icon"})),
          (span({className: "menu-label"}, options.menuAnchorName))
      ))
    const menuKey = `other-menu-${options.className || ''}-${options.menuAnchorName || ''}`

    return (Dropdown({key: menuKey, items: options.menu, menuAnchor: menuAnchor, className: options.className,
      subMenuExpandIcon: menuBarOptions.subMenuExpandIcon}))
  },

  render() {
    const { provider, client, options, fileStatus } = this.props
    const currentLang = getCurrentLanguage()
    console.log(`MenuBar: current language is ${currentLang}`)
    const langClass = getSpecialLangFontClassName(currentLang)
    const isAuthorized = provider && provider.isAuthorizationRequired() && provider.authorized()
    return (
      (div({className: `menu-bar ${options.clientToolBarPosition === "left" ? 'toolbar-position-left' : ''} ${langClass}`},
        (div({className: 'menu-bar-left'},
          this.renderFileMenu(),
          (div({className: `menu-bar-content-filename ${langClass}`},
            this.state.editingFilename
            ? (input({ref: ((elt: any) => { this.filenameRef = elt }), value: this.state.editableFilename,
                onChange: this.filenameChanged, onKeyDown: this.watchForEnter,
                onMouseEnter: (e: React.MouseEvent) => e.stopPropagation(), onMouseMove: (e: React.MouseEvent) => e.stopPropagation()
              }))
            : (span({className: 'content-filename', onClick: this.filenameClicked}, this.state.filename)),
                this.props.fileStatus
                  ? (span({className: `menu-bar-file-status ${fileStatus.type} ${langClass}`}, fileStatus.message))
                  : undefined
          )),
        )),
        (div({className: 'menu-bar-center'},
          (img({className: 'app-logo', src: client.appOptions.appIcon, alt: "CODAP Logo", onClick: this.infoClicked})),
          this.props.options.info ?
            (span({className: 'menu-bar-info'}, options.info)) : undefined,
        )),
        (div({className: 'menu-bar-right'},
          isAuthorized ? this.props.provider.renderUser() : undefined,
          this.props.options.otherMenus && this.props.options.otherMenus.map((menuOptions: CFMUIMenuOptions) => {
            return this.renderOtherMenu(menuOptions)
          }),
          this.props.options.languageMenu ?
            this.renderLanguageMenu() : undefined
        ))
      ))
    )
  }
})
