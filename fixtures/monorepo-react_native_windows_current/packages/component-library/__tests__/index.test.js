import * as React from 'react';
import { mount } from 'enzyme';
import Counter from '../index.windows.js';

let subject;
afterEach(() => {
  subject.unmount();
});

test('Renders content rating image', () => {
  subject = mount(<Counter />);

  expect(subject).toBeTruthy();
});

