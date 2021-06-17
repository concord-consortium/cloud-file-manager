// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {div, ul, li} = ReactDOMFactories

class TabInfo {
  capability: any;
  component: any;
  label: any;
  onSelected: any;

  constructor(settings: any) {
    if (settings == null) { settings = {} }
    ({label: this.label, component: this.component, capability: this.capability, onSelected: this.onSelected} = settings)
  }
}

const Tab = createReactClassFactory({

  displayName: 'TabbedPanelTab',

  clicked(e: any) {
    e.preventDefault()
    return this.props.onSelected(this.props.index)
  },

  render() {
    const classname = this.props.selected ? 'tab-selected' : ''
    return (li({className: classname, onClick: this.clicked}, this.props.label))
  }
})

export default createReactClass({

  displayName: 'TabbedPanelView',

  getInitialState() {
    return {selectedTabIndex: this.props.selectedTabIndex || 0}
  },

  componentDidMount() {
    return (typeof this.props.tabs[this.state.selectedTabIndex].onSelected === 'function' ? this.props.tabs[this.state.selectedTabIndex].onSelected(this.props.tabs[this.state.selectedTabIndex].capability) : undefined)
  },

  statics: {
    Tab(settings: any) { return new TabInfo(settings) }
  },

  selectedTab(index: any) {
    if (typeof this.props.tabs[index].onSelected === 'function') {
      this.props.tabs[index].onSelected(this.props.tabs[index].capability)
    }
    return this.setState({selectedTabIndex: index})
  },

  renderTab(tab: any, index: any) {
    return (Tab({
      label: tab.label,
      key: index,
      index,
      selected: (index === this.state.selectedTabIndex),
      onSelected: this.selectedTab
    }))
  },

  renderTabs() {
    return (div({className: 'workspace-tabs'},
      (Array.from(this.props.tabs).map((tab, index) => ul({key: index}, this.renderTab(tab, index))))
    ))
  },

  renderSelectedPanel() {
    return (div({className: 'workspace-tab-component'},
      Array.from(this.props.tabs).map((tab, index) =>
        (div({
          key: index,
          style: {
            display: index === this.state.selectedTabIndex ? 'block' : 'none'
          }
          },
          (tab as any).component
        )))
    ))
  },

  render() {
    return (div({className: "tabbed-panel"},
      this.renderTabs(),
      this.renderSelectedPanel()
    ))
  }
})
