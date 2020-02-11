import React from 'react';
import { AppRegistry, View, Text, Linking } from 'react-native';
import {
  createAppContainer,
  createBottomTabNavigator,
  NavigationActions,
} from 'react-navigation';
import Multibundle from 'react-native-multibundle';
import EmptyHost from './EmptyHost';

function makeScreenForAppBundle(bundleName) {
  const screen = props => {
    if (!Multibundle.isBundleLoaded(bundleName)) {
      throw new Error(`App bundle ${bundleName} was not loaded`);
    }

    const Component = Multibundle.getBundleExport(bundleName);
    return <Component {...props} />;
  };

  return {
    screen,
    navigationOptions: {
      tabBarOnPress: ({ navigation, defaultHandler }) => {
        // if (Multibundle.isBundleLoaded(bundleName)) {
        //   defaultHandler();
        // } else {
        // const listener = ({
        //   bundleName: currentlyLoadedBundle,
        //   loadStartTimestamp,
        // }) => {
        //   if (currentlyLoadedBundle === bundleName) {
        //     BundleRegistry.removeListener('bundleLoaded', listener);
        // navigation.setParams({ loadStartTimestamp });
        //     defaultHandler();
        //   }
        // };
        Multibundle.loadBundle(bundleName).then(() => {
          navigation.setParams({ loadStartTimestamp: 1 });
          defaultHandler();
        });
        // }
      },
    },
  };
}

const AppContainer = createAppContainer(
  createBottomTabNavigator(
    {
      Initial: EmptyHost,
      app0: makeScreenForAppBundle('app0'),
      app1: makeScreenForAppBundle('app1'),
    },
    {
      initialRouteName: 'Initial',
    }
  )
);

Multibundle.enableLogging();

class RootComponent extends React.Component {
  constructor(props) {
    super(props);
  }

  navigatorRef = React.createRef();

  handleURL = event => {
    const [, bundleName] = event.url.match(/.+\/\/(.+)/);
    Multibundle.loadBundle(bundleName);
  };

  onBundleLoaded = ({ bundleName, loadStartTimestamp }) => {
    if (this.navigatorRef.current) {
      this.navigatorRef.current.dispatch(
        NavigationActions.navigate({
          routeName: bundleName,
          params: { loadStartTimestamp },
        })
      );
    }
  };

  async componentDidMount() {
    Linking.addEventListener('url', this.handleURL);

    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      this.handleURL({ url: initialUrl });
    }
  }

  componentWillUnmount() {
    Linking.removeListener('url', this.handleURL);
  }

  render() {
    return (
      <View style={{ flex: 1, width: '100%' }}>
        <AppContainer
          ref={this.navigatorRef}
          // we handle deep linking manually
          enableURLHandling={false}
        />
      </View>
    );
  }
}

export default RootComponent;
