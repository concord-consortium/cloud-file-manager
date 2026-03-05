import '@testing-library/jest-dom'

import { ConsoleMethod, IJestSpyConsoleOptions, jestSpyConsole, JestSpyConsoleFn } from "./jest-spy-console"

const g = global as any
g._ = require('lodash')
g.$ = require('jquery')

// providers use window.alert() (which isn't implemented in JSDom) to signal unimplemented methods
window.alert = jest.fn(msg => console.error(msg))

declare global {
  function jestSpyConsole(method: ConsoleMethod, fn: JestSpyConsoleFn,
                          options?: IJestSpyConsoleOptions): Promise<jest.SpyInstance>
}
global.jestSpyConsole = jestSpyConsole
