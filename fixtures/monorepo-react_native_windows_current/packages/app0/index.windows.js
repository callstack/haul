import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Counter } from '@components/component-library';

export default class App extends Component {
  render() {
    return <Counter />;
  }
}
