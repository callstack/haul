import React, { Suspense } from 'react';
import { View, Text } from 'react-native';
import Loading from './Loading';

const LazyApp = React.lazy(() => import('./LazyApp'));
const Container = React.lazy(() => import('./Container'));

export default function App() {
    return (
      <View>
        <Suspense fallback={<Loading />}>
          <Container>
            <LazyApp />
          </Container>
        </Suspense>
        <Text>Donut</Text>
      </View>
    );
}
