---
id: hmr_react_navigation
title: HMR setup with `react-navigation`
---

Since we don't know how your project looks like, we will use one of the possible setups. If your project is structured differently, please __tweak this guide according to your needs__.

---

Let's assume you have `index.js` file which imports your screens:

```javascript
// index.js
import {
  AppRegistry,
} from 'react-native';
import { StackNavigator } from 'react-navigation';

import HomeScreen from './src/HomeScreen';
import SecondScreen from './src/SecondScreen';

const MyApp = StackNavigator({
  Home: { screen: HomeScreen },
  Second: { screen: SecondScreen },
});

AppRegistry.registerComponent('MyApp', () => MyApp);
```

First thing you need to do is to add the following code snipped at the top of `App.js` file:

```diff
// index.js
+ import { makeHot, clearCacheFor, redraw } from 'haul/hot';
import {
  AppRegistry,
} from 'react-native';
import { StackNavigator } from 'react-navigation';

import HomeScreen from './src/HomeScreen';
import SecondScreen from './src/SecondScreen';

const MyApp = StackNavigator({
  Home: { screen: HomeScreen },
  Second: { screen: SecondScreen },
});

AppRegistry.registerComponent('MyApp', () => MyApp);
```

---

Now, if you're defining your screens using `screen` property, you must replace it with `getScreen` and convert the value to a function:

```diff
// index.js
import { makeHot, clearCacheFor, redraw } from 'haul/hot';
import {
  AppRegistry,
} from 'react-native';
import { StackNavigator } from 'react-navigation';

import HomeScreen from './src/HomeScreen';
import SecondScreen from './src/SecondScreen';

const MyApp = StackNavigator({
-   Home: { screen: HomeScreen },
-   Second: { screen: SecondScreen },
+   Home: { getScreen: () => HomeScreen },
+   Second: { getScreen: () => SecondScreen },
});

AppRegistry.registerComponent('MyApp', () => MyApp);
```

Since a comparison is made of the results of `getScreen` each time the drawer is toggled, we need to make sure that subsequent calls of our function return the same value. 

To do this, we need to create our `HotViews` then provide them as a result to `getScreen`.  

```diff
// index.js
import { makeHot, clearCacheFor, redraw } from 'haul/hot';
import {
  AppRegistry,
} from 'react-native';
import { StackNavigator } from 'react-navigation';

import HomeScreen from './src/HomeScreen';
import SecondScreen from './src/SecondScreen';

+ const HotViews = {
+   Home: makeHot(() => HomeScreen, 'Home'),
+   Second: makeHot(() => SecondScreen, 'Second')
+ };

const MyApp = StackNavigator({
-   Home: { getScreen: () => HomeScreen },
-   Second: { getScreen: () => SecondScreen },
+   Home: { getScreen: HotViews.Home },
+   Second: { getScreen: HotViews.Second },
});

AppRegistry.registerComponent('MyApp', () => MyApp);
```

> When doing this it ensures that `HotViews.Home() === HotViews.Home()` so that unnecessary re-renders do not occur.

---

Now, the screens can be updated upon hot update by calling `redraw`.
Place the following code snipped at the end of the file:

```diff
// index.js
import { makeHot, clearCacheFor, redraw } from 'haul/hot';
import {
  AppRegistry,
} from 'react-native';
import { StackNavigator } from 'react-navigation';

import HomeScreen from './src/HomeScreen';
import SecondScreen from './src/SecondScreen';

const MyApp = StackNavigator({
  Home: { getScreen: makeHot(() => HomeScreen, 'Home') },
  Second: { getScreen: makeHot(() => SecondScreen, 'Second') },
});

AppRegistry.registerComponent('MyApp', () => MyApp);

+ if (module.hot) {
+   module.hot.accept('./src/HomeScreen.js', () => {
+     clearCacheFor(require.resolve('./src/HomeScreen'));
+     redraw(() => require('./src/HomeScreen').default, 'Home');
+   });
+   module.hot.accept('./src/SecondScreen.js', () => {
+     clearCacheFor(require.resolve('./src/SecondScreen'));
+     redraw(() => require('./src/SecondScreen').default, 'Second');
+   });
+ }
```

Each screen must have a separate `module.hot.accept` call with first argument being a path to the file with the screen.
Usually you can just copy the path from `import` statement.

Inside each `module.hot.accept`'s second argument (which is a function), you need to call `clearCacheFor` with `require.resolve` and the path to a screen.
Finally, you need to call `redraw` function and pass screen factory method, which must return an updated screen component (the best way to do it, is to `require` it)
and the name of the screen - the same one as in `makeHot`.

Now, enable HMR from _Developer menu_ by taping _Enable Hot Reloading_.