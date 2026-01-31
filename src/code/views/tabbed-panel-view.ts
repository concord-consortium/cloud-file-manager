import createReactClass from "create-react-class"
import ReactDOMFactories from "react-dom-factories"
import { createReactClassFactory } from "../create-react-factory"

const {div, ul, li} = ReactDOMFactories

class TabInfo {
  capability: any
  component: any
  label: any
  onSelected: any

  constructor(settings: any = {}) {
    ({label: this.label, component: this.component, capability: this.capability, onSelected: this.onSelected} = settings)
  }
}

const Tab = createReactClassFactory({

  displayName: 'TabbedPanelTab',

  clicked(e: React.MouseEvent<HTMLLIElement>) {
    e.preventDefault()
    this.props.onSelected(this.props.index)
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
    const tab = this.props.tabs[this.state.selectedTabIndex]
    tab.onSelected?.(tab.capability)
  },

  statics: {
    Tab(settings: any) { return new TabInfo(settings) }
  },

  selectedTab(index: number) {
    const tab = this.props.tabs[index]
    tab.onSelected?.(tab.capability)
    this.setState({selectedTabIndex: index})
  },

  renderTab(tab: TabInfo, index: number) {
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
      this.props.tabs.map((tab: TabInfo, index: number) => ul({key: index}, this.renderTab(tab, index)))
    ))
  },

  renderSelectedPanel() {
    return (div({className: 'workspace-tab-component'},
      this.props.tabs.map((tab: TabInfo, index: number) =>
        div({
          key: index,
          style: {
            display: index === this.state.selectedTabIndex ? 'block' : 'none'
          }
        }, tab.component)
      )
    ))
  },

  render() {
    return (div({className: "tabbed-panel"},
      this.renderTabs(),
      this.renderSelectedPanel()
    ))
  }
})
