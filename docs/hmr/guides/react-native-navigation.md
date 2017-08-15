# HMR setup with `react-native-navigation`

> Navigate to: [API docs](../API.md)

Since we don't know how your project looks like, we will use one of the possible setups. If your project is structured differently, plese __tweak this guide according to your needs__.

---

Let's assume you have `index.ios.js`/`index.android.js` file which only import `src/index.js`. Add `import 'haul/hot/patch';` at the beginning:

```diff
// `index.ios.js`/`index.android.js`
+ import 'haul/hot/patch';
import './src/index.js';
```

`import 'haul/hot/patch';` should be placed in the root file / entry file, since __the code from this file must be executed before anything else!__

---

Let's assume that `./src/index.js` bootstraps the navigation with screens from `./screens.js`:
```javascript
/* @flow */

import { Navigation } from 'react-native-navigation';
import { Platform } from 'react-native';

import './screens';

/* ... rest of the file ... */

Navigation.startTabBasedApp({
  /* ... */
});
```
---

So, the `./screens.js` is the file when we will write out HMR logic. Let's assume it looks like this:

```javascript
/* @flow */

import { Navigation } from 'react-native-navigation';

// Screens
import Calendar from './Calendar';
import Localization from './Localization';
import Information from './Information';

Navigation.registerComponent('Calendar', () => Calendar);
Navigation.registerComponent('Localization', () => Localization);
Navigation.registerComponent('Information',() => Information);
```

Now, make the following changes:

```diff
import { Navigation } from 'react-native-navigation';
+ import {
+   makeHot,
+   redraw,
+   callOnce,
+   clearCacheFor
+ } from 'haul/hot';

// Screens
import Calendar from './Calendar';
import Localization from './Localization';
import Information from './Information';

- Navigation.registerComponent('Calendar', () => Calendar);
+ Navigation.registerComponent('Calendar', makeHot(() => Calendar, 'Calendar');
- Navigation.registerComponent('Localization', () => Localization);
+ Navigation.registerComponent('Localization', makeHot(() => Localization, 'Localization');
- Navigation.registerComponent('Information',() => Information);
+ Navigation.registerComponent('Information', makeHot(() => Information, 'Information');

+ if (module.hot) {
+   module.hot.accept('./Calendar.js', () => {
+     clearCacheFor(require.resolve('./Calendar.js'));
+     redraw(() => require('./Calendar.js').default, 'Calendar');
+   });
+   module.hot.accept('./Localization.js', () => {
+     clearCacheFor(require.resolve('./index.js'));
+     redraw(() => require('./Localization.js').default, 'Localization');
+   });
+   module.hot.accept('./Information.js', () => {
+     clearCacheFor(require.resolve('./index.js'));
+     redraw(() => require('./Information.js').default, 'Information');
+   });
+ }
```

Now, enable HMR from _Developer menu_ by taping _Enable Hot Reloading_.