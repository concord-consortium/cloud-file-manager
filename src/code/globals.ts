// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
// global vars

import {polyfill} from 'es6-promise'
import _ from 'lodash'
import $ from 'jquery'
import React from 'react'
import ReactDOM from 'react-dom'
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import ReactDOMFactories from 'react-dom-factories'
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'crea... Remove this comment to see the full error message
import createReactClass from 'create-react-class'

// https://reactjs.org/blog/2020/02/26/react-v16.13.0.html#deprecating-reactcreatefactory
const createReactFactory = (type: any) => React.createElement.bind(null, type)
const createReactClassFactory = (classDef: any) => createReactFactory(createReactClass(classDef))

polyfill()

global._ = _;
(global as any).$ = $
global.React = React
global.ReactDOM = ReactDOM;
(global as any).ReactDOMFactories = ReactDOMFactories;

// https://reactjs.org/docs/react-without-es6.html
(global as any).createReactClass = createReactClass;
(global as any).createReactFactory = createReactFactory;
(global as any).createReactClassFactory = createReactClassFactory

export { createReactFactory, createReactClassFactory }
