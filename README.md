# React Algebra

A library of combinators for react components with render callbacks.

# Background

## List concatenation

The basic premise of this library is that concatenation and composition are two sides of the same coin. Consider the ways we can think about combining [linked lists](https://en.wikipedia.org/wiki/Linked_list):

**Concatentation**, i.e. as two lists are joined end-to-end:
```haskell
   [foo, bar] ++ [baz, quux]
-- [foo, bar, baz, quux]
```

**Composition**, i.e. as one list is inserted deeply into another:
```haskell
   (Cons foo (Cons bar Nil)) ++ (Cons baz (Cons quux Nil))
-- Cons foo (Cons bar (Cons baz (Cons quux Nil)))
```

The right list replaces the `Nil` of the left list; it fills in the "hole" left by the Nil.

If you parameterize the hole as a function argument, then concatenating lists _is_ function composition:

```haskell
   (\x -> foo : bar : x) . (\x -> baz : quux : x)
-- (\x -> Cons foo (Cons bar x)) . (\x -> Cons baz (Cons quux x))
-- \x -> foo : bar : baz : quux : x
```

This pattern is called a [difference list](https://en.wikipedia.org/wiki/Difference_list). Note that while concatenating linked lists is 𝚶(n), composing functions is 𝚶(1). This is a common performance hack in functional languages.

---
Aside:

Not every list has a nil element. Linked lists can be circular:

```haskell
let x = foo : bar : y
    y = baz : quux : x
in  x
-- foo : bar : baz : quux : foo : bar ...
```

Linked lists in Haskell can also be infinite:

```haskell
let x = [1 ..]
-- 1 : 2 : 3 : 4 : 5 ...
```

The normal definition of concatenation as replacing a `Nil` doesn't work here, because there is no `Nil`. Concatenation of infinite structures requires a completely different definition, which (may be? is?) beyond the scope of this project.

---

## Algebraic properties of concatenation & composition

There are many similarities between list concatenation and function composition. Both operations are associative:

```haskell
(xs ++ ys) ++ zs == xs ++ (ys ++ zs)
(f  .  g)  .  h  == f  .  (g  .  h)
```

Both operations have an identity element:

```haskell
xs ++ [] == [] ++ xs == xs
f  .  id == id .  f  == f
```

This combination of properties (associativity with an identity element) appears frequently in programming: it also describes addition over numbers with identity 0, multiplication with numbers with identity 1, bools with `or`, `and` and `xor`, sets with union and intersection, and many others. The term for this relationship between type, operation and identity element is called a [monoid](https://en.wikibooks.org/wiki/Haskell/Monoids).

A property of all monoids is that the operation works well in folds. A lot of useful functions are just folds over monoids:

```haskell
sum     = foldr (+)  0
product = foldr (*)  1
concat  = foldr (++) []
```

Because the operation is associative, it gives the same result whether one is folding from the left or the right:

```haskell
sum = foldl (+) 0
sum = foldr (+) 0
```

Because there is an identity element, it has a well-defined answer for folding over empty lists:

```haskell
sum [1 2 3] -- 6
sum [1]     -- 1
sum []      -- 0
```

This property is exploited by many lisps for variadic functions:

```clojure
(+ 1 2 3) ; 6
(+ 1)     ; 1
(+)       ; 0
```

## Combining trees

Lists aren't the only structures that could be combined. A lot of data structures are structured as some form of tree. Consider these blocks of XML:

```xml
<foo>
    <bar><baz /></bar>
</foo>

<quux />
```

This could be represented as lisp represents s-expressions, i.e. a list of mixed lists & atoms:

```clojure
(foo (bar baz)) ; (foo . (bar . baz . nil) . nil)
(quux)          ; (quux . nil)
```

Or as [rose trees](https://en.wikipedia.org/wiki/Rose_tree) in typed languages:

```haskell
Tree foo [Tree bar [Tree baz []]]
Tree quux []
```

However, there's no one obvious way to combine trees; there are many potential 'holes' in the left-hand list. Concatenating these lists together would result in the tree

```xml
<foo>
    <bar><baz /></bar>
    <quux />
</foo>
```

But there are other plausible combinations:

```xml
<foo>
    <bar><baz /></bar>
</foo>
<quux />

<foo>
    <bar>
        <baz />
        <quux />
    </bar>
</foo>

<foo>
    <bar>
        <baz><quux /></baz>
    </bar>
</foo>
```

What if you were to parameterize the hole, as one does in a difference list? The hole doesn't have to go at the end of the outermost list; it could go _anywhere_:

```haskell
(\x -> [
    Tree foo [
        Tree bar ((Tree baz []) : x)
    ]
]) . (\x -> (Tree quux []) : x)
-- \x -> [
--     Tree foo [
--         Tree bar
--             (Tree baz [])
--             : (Tree quux [])
--             : x
--         )
--     ])
-- ]
```

This is structurally similar to React components with children:

```js
let X = ({ children }) =>
    <foo>
        <bar>
            <baz />
            {children}
        </bar>
    </foo>

let Y = ({ children }) =>
    <><quux/>{children}</>

let Z = ({ children }) =>
    <X>
        <Y>{children}</Y>
    </X>
// <foo>
//     <bar>
//         <baz />
//         <quux />
//         {children}
//     </bar>
// </foo>
```

## Props and Render Callbacks

There are two additional questions we need to resolve before we can apply this algebra to React. How do we handle props? React components typically have arguments besides `children`, which complicate component composition. How would we pass props to the child components? One approach is to pass all props to all components:

```js
const X = ({ foo, bar, children }) =>
    <div className={foo}>
        <h1>{bar}</h1>
        {children}
    </div>

const Y = ({ baz, quux, children }) =>
    <nav>
        <a href={baz}>{quux}</a>
        {children}
    </nav>

const XY = comp(X, Y)
// ({ foo, bar, baz, quux, children }) =>
//     <div className={foo}>
//         <h1>{bar}</h1>
//         <nav>
//             <a href={baz}>{quux}</a>
//             {children}
//         </nav>
//     </div>
```

However, this requires components to use unique names for their props and ignore props they don't use. An alternate and more powerful approach uses [render props](https://cdb.reacttraining.com/use-a-render-prop-50de598f11ce) -- the parent renders its children as a _component_, not as elements, and pass props to that child component:

```js
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

comp(X, Y)
// ({ foo }) =>
//     <div>
//         <h1>Test</h1>
//         <div>
//             <span>foo: {foo}</span>
//             <span>bar: {foo * 2}</span>
//         </div>
//     </div>
```

This enables a whole class of _component combinators_. For example, this creates a component that is structurally neutral (i.e. produces no DOM elements of its own) and only adds props to its children:

```js
const X = ({ children: C, foo, bar }) =>
    <div>
        <span>foo: {foo}</span>
        <C bar={bar} />
    </div>
comp(withProps({ foo: 100, bar: 200 }), X)
// ({ children: C }) =>
//     <div>
//         <span>foo: {100}</span>
//         <C bar={200} />
//     </div>
```

This absorbs the props passed by its parent and passes it to its _grandchildren_, skipping its immediate children:

```js
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
// () =>
//     <div>
//         <h1>Parent</h1>
//         <div>
//             <h2>Child</h2>
//             <span>foo: {0}</span>
//             <span>bar: {0}</span>
//             <div>
//                 <h3>Grandchild</h3>
//                 <span>foo: {100}</span>
//                 <span>bar: {200}</span>
//                 <span>baz: {300}</span>
//             </div>
//         </div>
//     </div>
```
