/*
  For historical reasons the CFM is distributed as two bundles. The "app" bundle contains the CFM
  code itself while the "globals" bundle contains various shared third-party library code.
  Clients like CODAP use the "app" bundle but not the "globals" bundle and this prevents
  duplication of the third-party library code. For this to work, the third-party globals are
  attached to the window object and all access to these globals from CFM code should be through
  the window object. If CFM code were to import from these third-party libraries directly
  Webpack would include a copy of the third-party library code in the CFM "app" bundle which
  would result in bloating the size of the bundle and possibly introducing bugs, such as can
  occur with multiple copies of React, for instance. This module imports the required third-party
  libraries and attaches them to the window object and also adds their types to the global
  Window interface to make TypeScript happy. For unit tests without access to the Window object
  to work, the global environment must be similarly configured, e.g. in setupTests.ts.
 */

import {polyfill} from 'es6-promise'
import _ from 'lodash'
import $ from 'jquery'
import React from 'react'
import ReactDOM from 'react-dom'
import ReactDOMFactories from 'react-dom-factories'
import createReactClass from 'create-react-class'

// https://reactjs.org/blog/2020/02/26/react-v16.13.0.html#deprecating-reactcreatefactory
const _createReactFactory = (type: any) => React.createElement.bind(null, type)
const _createReactClassFactory = (classDef: any) => createReactFactory(createReactClass(classDef))

polyfill()

declare global {
  var _: typeof _
  // var $: typeof $
  var React: typeof React
  var ReactDOM: typeof ReactDOM
  var ReactDOMFactories: typeof ReactDOMFactories
  var createReactClass: typeof createReactClass
  var createReactFactory: typeof _createReactFactory
  var createReactClassFactory: typeof _createReactClassFactory
}

const g = global as any
g._ = _
g.$ = $
g.React = React
g.ReactDOM = ReactDOM
g.ReactDOMFactories = ReactDOMFactories

// https://reactjs.org/docs/react-without-es6.html
g.createReactClass = createReactClass
g.createReactFactory = _createReactFactory
g.createReactClassFactory = _createReactClassFactory
