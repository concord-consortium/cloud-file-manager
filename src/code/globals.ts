/*
  For historical reasons the CFM is distributed as two bundles. The "app" bundle contains the CFM
  code itself while the "globals" bundle contains various shared third-party library code.
  Clients like CODAP use the "app" bundle but not the "globals" bundle and this prevents
  duplication of the third-party library code. For this to work, the third-party globals are
  defined on the global object and all access to these globals from CFM code should be through
  these global definitions. Webpack is configured to interpret imports of these libraries as
  references to the corresponding globals. This module imports the required third-party
  libraries and defines the corresponding globals. For unit tests without access to the globals
  bundle to work, the global environment must be similarly configured, e.g. in setupTests.ts.
 */

import _ from 'lodash'
import $ from 'jquery'
import React from 'react'
import ReactDOM from 'react-dom'

const g = global as any
g._ = _
g.$ = $
g.React = React
g.ReactDOM = ReactDOM
