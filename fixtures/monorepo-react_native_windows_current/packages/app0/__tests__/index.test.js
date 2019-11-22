import * as React from 'react';
import { mount } from 'enzyme';
import App from '../index.windows';

let subject;
afterEach(() => {
  subject.unmount();
});

test('Renders content rating image', () => {
  subject = mount(<App />);

  expect(subject).toBeTruthy();
});

