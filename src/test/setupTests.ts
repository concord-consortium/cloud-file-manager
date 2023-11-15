import '@testing-library/jest-dom'
import React from 'react'

import { ConsoleMethod, IJestSpyConsoleOptions, jestSpyConsole, JestSpyConsoleFn } from "./jest-spy-console"

const g = global as any
g._ = require('lodash')
g.$ = require('jquery')
g.createReactClass = require('create-react-class')
g.ReactDOMFactories = require('react-dom-factories')

// https://reactjs.org/blog/2020/02/26/react-v16.13.0.html#deprecating-reactcreatefactory
g.createReactFactory = (type: any) => React.createElement.bind(null, type)
g.createReactClassFactory = (classDef: any) => g.createReactFactory(g.createReactClass(classDef))

// providers use window.alert() (which isn't implemented in JSDom) to signal unimplemented methods
window.alert = jest.fn(msg => console.error(msg))

declare global {
  function jestSpyConsole(method: ConsoleMethod, fn: JestSpyConsoleFn,
                          options?: IJestSpyConsoleOptions): Promise<jest.SpyInstance>
}
global.jestSpyConsole = jestSpyConsole
