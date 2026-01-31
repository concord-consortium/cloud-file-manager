import createReactClass from "create-react-class"
import React from "react"

// Factory function type that accepts any props - proper typing deferred to Phase 4 React modernization
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReactFactory<P = any> = (props?: (React.Attributes & P) | null, ...children: React.ReactNode[]) => React.ReactElement

// https://reactjs.org/blog/2020/02/26/react-v16.13.0.html#deprecating-reactcreatefactory
// Using wrapper function instead of .bind() to avoid strictBindCallApply type issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createReactFactory = <P = any>(type: any): ReactFactory<P> =>
  (props, ...children) => React.createElement(type, props, ...children)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createReactClassFactory = <P = any, S = {}>(classDef: React.ComponentSpec<P, S>): ReactFactory<P> =>
  createReactFactory(createReactClass<P, S>(classDef))
