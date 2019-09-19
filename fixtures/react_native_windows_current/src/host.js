import React from 'react';
import { AppRegistry, View, Text, Linking } from 'react-native';
import { createAppContainer, createBottomTabNavigator, NavigationActions } from 'react-navigation';
import { ApolloClient } from 'apollo-client';
import { ApolloProvider } from 'react-apollo';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import EmptyHost from './EmptyHost';
import BundleRegistry from './BundleRegistry';

function makeScreenForAppBundle(bundleName) {
  const screen = (props) => {
    if (!BundleRegistry.isBundleLoaded(bundleName)) {
      throw new Error(`App bundle ${bundleName} was not loaded`);
    }
    
    const Component = BundleRegistry.getBundleExport(bundleName);
    return <Component {...props} />
  };

  return {
    screen,
    navigationOptions: {
      tabBarOnPress: ({ navigation, defaultHandler }) => {
        if (BundleRegistry.isBundleLoaded(bundleName)) {
          defaultHandler();
        } else {
          const listener = ({ bundleName: currentlyLoadedBundle, loadStartTimestamp }) => {
            if (currentlyLoadedBundle === bundleName) {
              BundleRegistry.removeListener('bundleLoaded', listener);
              navigation.setParams({ loadStartTimestamp });
              defaultHandler();
            }
          };
          BundleRegistry.addListener('bundleLoaded', listener);
          BundleRegistry.loadBundle(bundleName);
        }
      }
    }
  }
}

const AppContainer = createAppContainer(
  createBottomTabNavigator({
    Initial: EmptyHost,
    app0: makeScreenForAppBundle('app0'),
    app1: makeScreenForAppBundle('app1'),
  }, {
    initialRouteName: 'Initial',
  })
);

BundleRegistry.enableLogging();

const cache = new InMemoryCache();
const apolloClient = new ApolloClient({
  link: createHttpLink({ uri: "https://48p1r2roz4.sse.codesandbox.io" }),
  cache
});

class RootComponent extends React.Component {
  constructor(props) {
    super(props)
  }

  navigatorRef = React.createRef();

  handleURL = (event) => {
    const [, bundleName] = event.url.match(/.+\/\/(.+)/);
    BundleRegistry.loadBundle(bundleName);
  }

  onBundleLoaded = ({ bundleName, loadStartTimestamp }) => {
    if (this.navigatorRef.current) {
      this.navigatorRef.current.dispatch(NavigationActions.navigate({
        routeName: bundleName,
        params: { loadStartTimestamp }
      }));
    }
  }

  async componentDidMount() {
    BundleRegistry.addListener('bundleLoaded', this.onBundleLoaded);
    Linking.addEventListener('url', this.handleURL);

    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      this.handleURL({ url: initialUrl });
    }
  }

  componentWillUnmount() {
    Linking.removeListener('url', this.handleURL);
    BundleRegistry.removeListener('bundleLoaded', this.onBundleLoaded);
  }

  render() {
    return (
      <View style={{ flex: 1, width: '100%' }}>
        <ApolloProvider client={apolloClient}>
          <AppContainer
            ref={this.navigatorRef}
            // we handle deep linking manually
            enableURLHandling={false}
          />
        </ApolloProvider>
      </View>
    )
  }
}

AppRegistry.registerComponent('react_native_windows_current', () => RootComponent);
