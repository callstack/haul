import React from 'react';
import { Image } from 'react-native';
import Baz from 'baz';
import Bar from 'bar';

export default () => (
  <>
    <Image source={require('./asset.png')} />
    <Bar />
    <Baz />
  </>
);


