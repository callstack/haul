import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

export default class App extends Component {
  state = {
    counter: 0,
  };

  render() {
    console.log(this.props.navigation);
    const loadTime = Math.abs(
      Date.now() - this.props.navigation.state.params.loadStartTimestamp
    );
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>App 0</Text>
        <Text style={styles.body}>Load time: {loadTime} ms</Text>
        <Text style={styles.instructions}>To get started, edit App.js</Text>
        <Text style={styles.instructions}>{instructions}</Text>
        <Text style={styles.instructions}>Counter: {this.state.counter}</Text>
        <TouchableOpacity
          onPress={() => {
            this.setState(state => ({ counter: state.counter + 1 }));
          }}
        >
          <Text style={styles.instructions}>Increment</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 36,
    textAlign: 'center',
    color: '#282828',
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  body: {
    fontSize: 24,
    textAlign: 'center',
    color: '#282828',
  },
});
