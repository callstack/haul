---
id: hmr_setup
title: Hot Module Replacement setup
---

For projects created before version 0.49.0, use [this guide](https://github.com/callstack/haul/blob/740b6c3cfb51d3919c69e37935d69a4c96dec94e/docs/hmr/Setup.md).

__The instructions below assume you're running RN 0.49.0 or newer.__

> Jump to: [Automatic setup](#automatic-setup) | [Manual setup](#manual-setup)

For smaller projects, we provide automatic option for setting up Hot Module Replacement. If your project meets the following criteria, you can use our one-line setup for HMR:

* Single root component exported from `App.js` file with `default` keyword (`export default`)
* Single `AppRegistry.registerComponent` call in `index.js`

So, `index.js` file should look more or less like this:

```javascript
import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('MyProject', () => App);
```

All **default** `index.js` and `App.js` files created by `react-native init` work with the automatic setup out of the box.

## Automatic setup

In order to enable HMR add `import 'haul/hot';` at the top of the `index.js` file. Then, from within _Developer menu_ tap _Enable Hot Reloading_.

## Manual setup
> Navigate to: [API docs](./HMR_API.md)

> Jump to: [Examples](#examples)

For advanced projects or the ones with different structure, we provide our own HMR API, which allows you to enable HMR regardless of which navigation library you use and how you structure your code.

This guide below is not a list of steps, but rather a set of rules and tips on how to setup HMR, since we don't know how your project looks like. However, if you're using one of the following navigation libraries, please refer to associated guide:

* [`react-navigation`](./HMR_react-navigation.md)
* [`react-native-navigation`](./HMR_react-native-navigation.md)

------

Haul uses `react-hot-loader` to support HMR. `react-hot-loader/patch`
is automatically imported in all entry points in development when
HMR is enabled.

Now, we need to wrap the __root component factories__ using `makeHot` function. Root component factory is a function that returns a __root component__:

```javascript
() => RootComponent
```

You can encounter those in `AppRegistry.registerComponent` or `Navigation.registerComponent` calls:

```javascript
AppRegistry.registerComponent('MyApp', () => MyApp);
// or
Navigation.registerComponent('MyScreen', () => MyScreen);
```

After wrapping those with `makeHot` it should look like this:

```javascript
AppRegistry.registerComponent('MyApp', makeHot(() => MyApp));
// or
Navigation.registerComponent('MyScreen', makeHot(() => MyScreen));
```

If your app has __multiple root components__ (usually they're treated as screens), you need to pass the second argument to `makeHot` call, which is a `id` of the component factory. It will be used later to tell which component needs to be redrawn:

```javascript
Navigation.registerComponent('MyScreen1', makeHot(() => MyScreen1, 'MyScreen1'));
Navigation.registerComponent('MyScreen2', makeHot(() => MyScreen2, 'MyScreen2'));
Navigation.registerComponent('MyScreen3', makeHot(() => MyScreen3, 'MyScreen3'));
```

All of the functions we use in this guide can be imported from `haul/hot`:

```javascript
import {
  makeHot,
  tryUpdateSelf,
  callOnce,
  clearCacheFor,
  redraw
} from 'haul/hot';
```

The last thing is to acually tell the Webpack which modules we want to accept and how to update them. You can safely copy-pase the following snippet:

```javascript
if (module.hot) {
  module.hot.accept('', () => {
    clearCacheFor(require.resolve(''));
    redraw(() => require('').default);
  });
}
```

Now, you need to replace empty strings with the paths according to the following rules:
* If you have a __single root component__, it's better to extract the `module.hot.accept` logic to a parent file (the one that imports the __root component__), then you can replace all of the empty strings with path to that component:
  ```javascript
  // file: index.js
  import App from './App';

  /* ... */

  if (module.hot) {
    module.hot.accept(() => {})
    module.hot.accept('./App', () => {
      clearCacheFor(require.resolve('./App'));
      redraw(() => require('./App').default);
    });
  }
  ```
* If you have a __multi root component__, all of the paths should point to the root component and each of the root components should have a separate `module.hot.accept` call:
  ```javascript
  // file: index.js
  import Screen1 from './Screen1';
  import Screen2 from './Screen2';

  /* ... */

  if (module.hot) {
    module.hot.accept(() => {})
    module.hot.accept('./Screen1', () => {
      clearCacheFor(require.resolve('./Screen1'));
      redraw(() => require('./Screen1').default, 'Screen1');
    });

    module.hot.accept('./Screen2', () => {
      clearCacheFor(require.resolve('./Screen2'));
      redraw(() => require('./Screen2').default, 'Screen2');
    });
  }
  ```

## Examples

### Single root component in a entry file

```javascript
import {
  makeHot,
  tryUpdateSelf,
  callOnce,
  clearCacheFor,
  redraw
} from 'haul/hot';
import {
  AppRegistry,
} from 'react-native';
import App from './App';

AppRegistry.registerComponent('MyApp', makeHot(() => App));

if (module.hot) {
  module.hot.accept(() => {})
  module.hot.accept(['./App'], () => {
    clearCacheFor(require.resolve('./App'));
    redraw(() => require('./App').default);
  });
}
```

### Multi root component

```javascript
// index.js
import './screens';
```

```javascript
// screens.js
import {
  makeHot,
  tryUpdateSelf,
  callOnce,
  clearCacheFor,
  redraw
} from 'haul/hot';
import Navigation from 'some-naviagtion-lib';

import Calendar from './Calendar';
import Location from './Location';

Navigation.registerComponent('Calendar', makeHot(() => Calendar, 'Calendar'));
Navigation.registerComponent('Location', makeHot(() => Location, 'Location'));

if (module.hot) {
  module.hot.accept('./Calendar', () => {
    clearCacheFor(require.resolve('./Calendar'));
    redraw(() => require('./Calendar').default, 'Calendar');
  });
  module.hot.accept('./Location', () => {
    clearCacheFor(require.resolve('./Location'));
    redraw(() => require('./Location').default, 'Location');
  });
}
```
