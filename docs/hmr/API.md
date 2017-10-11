# Haul HMR API

## Module `haul/hot/patch.js`

#### Usage:

```javascript
import 'haul/hot/patch';
// or
require('haul/hot/patch');
```

#### Description:

* In production (`NODE_ENV === 'production'`):
  does nothing.

* In development (`NODE_ENV !== 'production'`):
  
  Patches React's `createElement` and `createFactory`, so that they use `react-proxy` and return a proxied component. Those components behave like the normal ones, but have their state persisted between updates.

  This file __must be imported/required in the root file / entry file before anything else__, since the code must be executed at the very beginning.

## Module `haul/hot/index.js`

```javascript
import {
  makeHot,
  redraw,
  tryUpdateSelf,
  callOnce,
  clearCacheFor
} from 'haul/hot';
```

### `makeHot`

Wrap the initial root component factory with HotWrapper, which allows for force deep update of the components tree and servers as an error boundry. This function should be called only once, upon app's initial render.

In case of multi root component app, the second argument is used for differentiating the factories. When calling `redraw`, the same `id` must be passed as a 2nd argument.

#### Syntax:

```javascript
makeHot(
  rootFactory: () => ReactComponent,
  id?: string = 'default'
): () => ReactComponent
```

* `rootFactory: () => ReactComponent` - Initial root component factory, used to render the app's tree for the first time.

* `id?: string = 'default'` - Identifier of the root component factory in case of multi root component project.

#### Usage:

```javascript
AppRegistry.registerComponent('MyApp', makeHot(() => MyApp));
// named factory
AppRegistry.registerComponent('MyApp', makeHot(() => MyApp, 'MyApp'));
```

---
### `redraw`

Redraw the wrapped root component with a new (updated) tree from given factory function. The function accepts another function, which must return a React component with a new tree. Should be used only for component wrapped with `makeHot`.

In case of multi root component project, you must specify the `id` of the root component, which should be updated and re-rendered.

#### Syntax:

```javascript
redraw(newRootFactory: () => ReactComponent, id?: string = 'default'): void
```

* `newRootFactory: () => ReactComponent` - Root component factory with new updates.

* `id?: string = 'default'` - Identifier of the root component factory in case of multi root component project.

#### Usage:

```javascript
redraw(() => require('./file').default);
// or
redraw(() => require('./file').default, 'MyApp');
```

---
### `tryUpdateSelf`

Tries to re-render the root component. Only useful if your root component and call to `registerComponent` (or similar) resides in __the same file__. Then, upon update the module is reevaluated, but the app's component tree, remains the same unless this function is called.

#### Syntax:

```javascript
tryUpdateSelf(): void
```

#### Usage:

```javascript
tryUpdateSelf();
```

---
### `callOnce`

Ensures the given function will be called only once. Useful for calling function with side effects only once.

#### Syntax:

```javascript
callOnce(callback: () => void): void
```

* `callback: () => void` - Function which should be called only once.

#### Usage:

```javascript
callOnce(() => {
  AppRegistry.registerComponent('MyApp', () => MyApp);
});
```

---
### `clearCacheFor`

Clears cache for gived module.

#### Syntax:

```javascript
clearCacheFor(resolvedModuleId: string): void
```

* `resolvedModuleId: string` - fully resolved (with `require.resolve`) module ID.

#### Usage:

```javascript
clearCacheFor(require.resolve('./file.js'));
```

