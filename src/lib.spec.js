import React from 'react'
import renderer from 'react-test-renderer'
import { Id, comp, withProps, bypass, forward, Nil, concat } from './lib'

const r = (el) => renderer.create(el).toJSON()

it('preserves Id identity', () => {
    const X = () => <div>Test</div>
    const L = comp(Id, X)
    const R = comp(X, Id)

    expect(r(<X/>)).toEqual(r(<L />))
    expect(r(<X/>)).toEqual(r(<R />))
})

it('composes with child components', () => {
    const X = ({ foo, children: C }) =>
        <div>
            <h1>Test</h1>
            <C foo={foo} bar={foo * 2} />
        </div>
    const Y = ({ foo, bar }) =>
        <div>
            <span>foo: {foo}</span>
            <span>bar: {bar}</span>
        </div>

    const XY = comp(X, Y)

    expect(r(<XY foo={100} />)).toEqual(r(
        <div>
            <h1>Test</h1>
            <div>
                <span>foo: {100}</span>
                <span>bar: {200}</span>
            </div>
        </div>
    ))
})

it('applies props', () => {
    const X = ({ children: C, foo, bar }) =>
        <div>
            <span>foo: {foo}</span>
            <C bar={bar} />
        </div>
    const Y = ({ bar }) =>
        <div>
            <span>bar: {bar}</span>
        </div>

    const XYProps = comp(withProps({ foo: 100, bar: 200 }), X, Y)

    expect(r(<XYProps />)).toEqual(r(
        <div>
            <span>foo: {100}</span>
            <div>
                <span>bar: {200}</span>
            </div>
        </div>
    ))
})

it('bypasses props', () => {
    const X = ({ children: C }) =>
        <div>
            <h1>Parent</h1>
            <C foo={100} bar={200} />
        </div>
    const Y = ({ foo = 0, bar = 0, children: C }) =>
        <div>
            <h2>Child</h2>
            <span>foo: {foo}</span>
            <span>bar: {bar}</span>
            <C baz={300} />
        </div>
    const Z = ({ foo, bar, baz }) =>
        <div>
            <h3>Grandchild</h3>
            <span>foo: {foo}</span>
            <span>bar: {bar}</span>
            <span>baz: {baz}</span>
        </div>

    const XYZ = comp(X, bypass(Y), Z)

    expect(r(<XYZ />)).toEqual(r(
        <div>
            <h1>Parent</h1>
            <div>
                <h2>Child</h2>
                <span>foo: {0}</span>
                <span>bar: {0}</span>
                <div>
                    <h3>Grandchild</h3>
                    <span>foo: {100}</span>
                    <span>bar: {200}</span>
                    <span>baz: {300}</span>
                </div>
            </div>
        </div>
    ))
})

it('forwards props', () => {
    const X = ({ children: C }) =>
        <div>
            <h1>Parent</h1>
            <C foo={100} bar={200} />
        </div>
    const Y = ({ foo = 0, bar = 0, children: C }) =>
        <div>
            <h2>Child</h2>
            <span>foo: {foo}</span>
            <span>bar: {bar}</span>
            <C baz={300} />
        </div>
    const Z = ({ foo, bar, baz }) =>
        <div>
            <h3>Grandchild</h3>
            <span>foo: {foo}</span>
            <span>bar: {bar}</span>
            <span>baz: {baz}</span>
        </div>

    const XYZ = comp(X, forward(Y), Z)

    expect(r(<XYZ />)).toEqual(r(
        <div>
            <h1>Parent</h1>
            <div>
                <h2>Child</h2>
                <span>foo: {100}</span>
                <span>bar: {200}</span>
                <div>
                    <h3>Grandchild</h3>
                    <span>foo: {100}</span>
                    <span>bar: {200}</span>
                    <span>baz: {300}</span>
                </div>
            </div>
        </div>
    ))
})

it('preserves Nil identity', () => {
    const X = () => <div>Test</div>
    const L = concat(Nil, X)
    const R = concat(X, Nil)

    expect(r(<X/>)).toEqual(r(<L />))
    expect(r(<X/>)).toEqual(r(<R />))
})

it('concatenates components', () => {
    const X = ({ foo }) => <span>foo: {foo}</span>
    const Y = ({ bar }) => <span>bar: {bar}</span>
    const Z = ({ baz }) => <span>baz: {baz}</span>
    const XYZ = concat(X, Y, Z)

    expect(r(<XYZ foo={100} bar={200} baz={300}/>))
        .toEqual(r(<React.Fragment>
            <span>foo: {100}</span>
            <span>bar: {200}</span>
            <span>baz: {300}</span>
        </React.Fragment>))
})
