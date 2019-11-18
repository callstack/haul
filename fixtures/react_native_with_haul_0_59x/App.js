import React, { Suspense } from 'react';
import Loading from './Loading';

const LazyApp = React.lazy(() => import('./LazyApp'));
const Container = React.lazy(() => import('./Container'));

export default function App() {
    return (
      <Suspense fallback={<Loading />}>
        <Container>
          <LazyApp />
        </Container>
      </Suspense>
    );
}
