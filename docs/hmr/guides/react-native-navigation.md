# HMR setup with `react-native-navigation`

> Navigate to: [API docs](../API.md)

Since we don't know how your project looks like, we will use one of the possible setups. If your project is structured differently, please __tweak this guide according to your needs__.

---

Let's assume you have `index.js` file which imports your screens and bootstraps the navigation. Add `import 'haul/hot/patch';` at the beginning:

```diff
// index.js
+ import 'haul/hot/patch';
import { Navigation } from 'react-native-navigation';

// Screens
import Calendar from './Calendar';
import Localization from './Localization';
import Information from './Information';

Navigation.registerComponent('Calendar', () => Calendar);
Navigation.registerComponent('Localization', () => Localization);
Navigation.registerComponent('Information',() => Information);
```

`import 'haul/hot/patch';` should be placed in the root file / entry file, since __the code from this file must be executed before anything else!__

Now, make the following changes:

```diff
// index.js
import 'haul/hot/patch';
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

You may need to tweak the paths according to your project structure.

Now, enable HMR from _Developer menu_ by taping _Enable Hot Reloading_.