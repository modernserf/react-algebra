import { createElement as h, Fragment, Component } from 'react'

export const Nil = () => null

export const Id = ({ children: C, ...props }) => h(C, props)

const comp2 = (X, Y) => ({ children: C, ...props }) =>
    h(X, props, (passedProps) =>
        h(Y, passedProps, C))

export const comp = (...Cs) => Cs.reduce(comp2, Id)

export const withProps = (addProps) => ({ children: C, ...props }) =>
    h(C, { ...props, ...addProps })

export const bypass = (X) => ({ children: C, ...props }) =>
    h(X, {}, comp(withProps(props), C))

export const forward = (X) => ({ children: C, ...props }) =>
    h(X, props, comp(withProps(props), C))

export const before = (X) => ({ children: C, ...props }) =>
    h(Fragment, {}, [
        h(C, { key: 'l' }),
        h(X, { ...props, key: 'r' }, Nil),
    ])

export const after = (X) => ({ children: C, ...props }) =>
    h(Fragment, {}, [
        h(X, { ...props, key: 'l' }, Nil),
        h(C, { key: 'r' }),
    ])

const concat2 = (X, Y) => comp2(forward(after(X)), Y)

export const concat = (...Cs) => Cs.reduce(concat2, Nil)
