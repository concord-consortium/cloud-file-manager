// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ReactDOMFactories'.
const {div} = ReactDOMFactories

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'createReactClassFactory'.
const SelectProviderDialogTab = createReactClassFactory({
  displayName: 'SelectProviderDialogTab',
  render() { return (div({}, `TODO: SelectProviderDialogTab: ${this.props.provider.displayName}`)) }
})

export default SelectProviderDialogTab
