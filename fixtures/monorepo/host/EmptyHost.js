import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EmptyRootComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Host is empty</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
  },
  text: {
    fontSize: 28,
    textAlign: 'center',
    color: '#282828'
  }
});
