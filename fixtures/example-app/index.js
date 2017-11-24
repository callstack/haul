import 'haul/hot/patch';
import { makeHot, tryUpdateSelf, callOnce } from 'haul/hot';
import { AppRegistry } from 'react-native';
import App from './App';

tryUpdateSelf();

callOnce(() => {
  AppRegistry.registerComponent('Example', makeHot(() => App));
});

if (module.hot) {
  module.hot.accept(() => {});
  module.hot.accept('./App', () => {
    clearCacheFor(require.resolve('./index'));
    redraw(() => require('./index').default);
  });
}
