const path = require('path')

const CODE_DIR = `${path.sep}src${path.sep}code${path.sep}`
const TEST_DIR = `${path.sep}__tests__${path.sep}`

const isInScope = (filename) => {
  if (!filename.includes(CODE_DIR)) return false
  if (filename.includes(TEST_DIR)) return false
  if (filename.includes('.test.')) return false
  return true
}

const getMemberPropertyName = (callee) => {
  if (callee?.type !== 'MemberExpression') return null
  if (callee.computed) {
    if (callee.property?.type === 'Literal') return String(callee.property.value)
    return null
  }
  if (callee.property?.type === 'Identifier') return callee.property.name
  return null
}

// Only fire for receivers that plausibly are the CFM client:
//   this.confirm(...), client.confirm(...), this.client.confirm(...), foo.client.confirm(...)
const isCfmClientReceiver = (callee) => {
  if (callee?.type !== 'MemberExpression') return false
  const object = callee.object
  if (!object) return false
  if (object.type === 'ThisExpression') return true
  if (object.type === 'Identifier' && object.name === 'client') return true
  if (object.type === 'MemberExpression' && object.property?.type === 'Identifier' && object.property.name === 'client') return true
  return false
}

const isUndefinedLiteral = (node) => {
  if (!node) return true
  if (node.type === 'Identifier' && node.name === 'undefined') return true
  if (node.type === 'Literal' && node.value === undefined) return true
  return false
}

const getObjectLiteral = (node) => {
  return node?.type === 'ObjectExpression' ? node : null
}

const hasConfirmKindProp = (obj) => {
  return obj.properties.some((prop) => {
    if (prop.type !== 'Property' || prop.computed) return false
    if (prop.key?.type === 'Identifier') return prop.key.name === 'confirmKind'
    if (prop.key?.type === 'Literal') return prop.key.value === 'confirmKind'
    return false
  })
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require confirmKind for built-in confirm/confirmDialog calls'
    },
    schema: []
  },
  create(context) {
    const filename = context.getFilename()
    if (!isInScope(filename)) return {}

    return {
      CallExpression(node) {
        const propName = getMemberPropertyName(node.callee)
        if (propName !== 'confirm' && propName !== 'confirmDialog') return
        if (!isCfmClientReceiver(node.callee)) return

        if (propName === 'confirm') {
          const confirmKindArg = node.arguments?.[3]
          if (isUndefinedLiteral(confirmKindArg)) {
            context.report({
              node,
              message: 'Missing confirmKind argument on confirm() call'
            })
          }
          return
        }

        const arg = node.arguments?.[0]
        const obj = getObjectLiteral(arg)
        if (!obj) return
        if (!hasConfirmKindProp(obj)) {
          context.report({
            node,
            message: 'Missing confirmKind property on confirmDialog() call'
          })
        }
      }
    }
  }
}
