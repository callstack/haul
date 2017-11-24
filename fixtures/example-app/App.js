/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View, Button } from 'react-native';

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

type State = {
  count: number,
};

export default class App extends Component<State, *> {
  state = {
    number: 0,
  };

  increment = prevState => ({ number: prevState.number + 1 });
  decrement = prevState => ({ number: prevState.number - 1 });

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Welcome to React Native with Haul!!</Text>
        <Text style={styles.instructions}>To get started, edit App.js</Text>
        <Text style={styles.instructions}>{instructions}</Text>
        <Text style={styles.instructions}>{this.state.number}</Text>
        <Button
          title="Increment!"
          onPress={() => this.setState(this.increment)}
        />
        <Button
          title="Decrement!"
          onPress={() => this.setState(this.decrement)}
        />
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
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
