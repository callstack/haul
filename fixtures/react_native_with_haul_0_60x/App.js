import React, {Fragment} from 'react';
import {
  SafeAreaView,
  Text,
  StatusBar,
} from 'react-native';

import Assets from 'foo';

const App = () => {
  return (
    <Fragment>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <Assets />
        <Text>Donut</Text>
      </SafeAreaView>
    </Fragment>
  );
};

export default App;
