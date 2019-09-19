import React, { Component, Suspense } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const ExchangeRates = React.lazy(() => import('./ExchangeRates'));

export default class App extends Component {
  render() {
    const loadTime = Math.abs(Date.now() - this.props.navigation.state.params.loadStartTimestamp);
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>App 1</Text>
        <Text style={styles.body}>Load time: {loadTime} ms</Text>
        <View style={{ height: 400 }}>
          <Suspense fallback={<Text>Loading</Text>}><ExchangeRates /></Suspense>
          </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ead4f9',
  },
  welcome: {
    fontSize: 36,
    textAlign: 'center',
    color: '#282828',
  },
  body: {
    fontSize: 24,
    textAlign: 'center',
    color: '#282828',
  },
});
