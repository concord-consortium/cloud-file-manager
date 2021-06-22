import createReactClass from "create-react-class"
import React from "react"

// https://reactjs.org/blog/2020/02/26/react-v16.13.0.html#deprecating-reactcreatefactory
export const createReactFactory = (type: any) => React.createElement.bind(null, type)
export const createReactClassFactory = (classDef: any) => createReactFactory(createReactClass(classDef))
