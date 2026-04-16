const path = require('path')

const VIEW_DIR = `${path.sep}src${path.sep}code${path.sep}views${path.sep}`
const PROVIDER_DIR = `${path.sep}src${path.sep}code${path.sep}providers${path.sep}`

const isInScope = (filename) => {
  return filename.includes(VIEW_DIR) || filename.includes(PROVIDER_DIR)
}

const getAttribute = (node, name) => {
  return node.attributes?.find((attr) => attr.type === 'JSXAttribute' && attr.name?.name === name)
}

const getLiteralString = (attr) => {
  if (!attr || !attr.value) return null
  if (attr.value.type === 'Literal') return String(attr.value.value)
  if (attr.value.type === 'JSXExpressionContainer' && attr.value.expression.type === 'Literal') {
    return String(attr.value.expression.value)
  }
  return null
}

const getDataTestIdLiterals = (attr) => {
  if (!attr || !attr.value) return []
  if (attr.value.type === 'Literal') return [String(attr.value.value)]
  if (attr.value.type === 'JSXExpressionContainer') {
    const expr = attr.value.expression
    if (expr.type === 'Literal') return [String(expr.value)]
    if (expr.type === 'ConditionalExpression') {
      const consequent = expr.consequent
      const alternate = expr.alternate
      if (consequent.type === 'Literal' && alternate.type === 'Literal') {
        return [String(consequent.value), String(alternate.value)]
      }
    }
  }
  return []
}

const hasDataTestId = (node) => {
  const attr = getAttribute(node, 'data-testid')
  if (!attr) return false
  const values = getDataTestIdLiterals(attr)
  // If values are statically resolvable, require cfm- prefix; otherwise trust the dynamic expression.
  if (values.length === 0) return true
  return values.every((value) => /^cfm-/.test(value))
}

const classNameMatches = (node, regex) => {
  const attr = getAttribute(node, 'className')
  const value = getLiteralString(attr)
  if (value == null) return false
  return regex.test(value)
}

const classNameIncludes = (node, name) => {
  const attr = getAttribute(node, 'className')
  const value = getLiteralString(attr)
  if (value == null) return false
  return value.includes(name)
}

const hasRoleButton = (node) => {
  const attr = getAttribute(node, 'role')
  const value = getLiteralString(attr)
  return value === 'button'
}

const hasNonEmptyHref = (node) => {
  const attr = getAttribute(node, 'href')
  const value = getLiteralString(attr)
  return value != null && value.trim().length > 0
}

const hasOnClick = (node) => {
  return !!getAttribute(node, 'onClick')
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require cfm- data-testid on interactive or semantic UI elements'
    },
    schema: []
  },
  create(context) {
    const filename = context.getFilename()
    if (!isInScope(filename)) return {}

    return {
      JSXOpeningElement(node) {
        const elementName = node.name?.name
        if (!elementName) return

        const isInteractive = [
          'button',
          'input',
          'select',
          'textarea'
        ].includes(elementName)

        // react-aria-components interactive wrappers — they forward data-* via filterDOMProps.
        // ModalOverlay (backdrop) is intentionally excluded: the inner <Dialog> already carries
        // the cfm-modal-container sentinel.
        const isReactAriaInteractive = [
          'Button',
          'MenuItem',
          'Tab',
          'TabPanel',
          'Dialog'
        ].includes(elementName)

        const isClickableAnchor = elementName === 'a' && (hasOnClick(node) || hasRoleButton(node) || hasNonEmptyHref(node))

        const isDialogOrPanelWrapper = elementName === 'div' && classNameMatches(node, /-dialog$|-panel$|modal-/)
        const isMenuItem = classNameMatches(node, /menuItem/)
        const isSeparator = classNameIncludes(node, 'separator')

        if (!(isInteractive || isReactAriaInteractive || isClickableAnchor || isDialogOrPanelWrapper || isMenuItem)) return
        if (isSeparator) return
        if (hasDataTestId(node)) return

        context.report({
          node,
          message: 'Missing data-testid starting with "cfm-"'
        })
      }
    }
  }
}
