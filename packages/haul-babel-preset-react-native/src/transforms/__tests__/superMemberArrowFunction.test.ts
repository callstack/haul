import superMemberArrowFunction from '../superMemberArrowFunction';
// @ts-ignore
import classProperties from '@babel/plugin-proposal-class-properties';
import { transformSync } from '@babel/core';

const fixture = `
class Derived extends Super {
  derivedFn1 = async () => {
    await super.superFn1();
  };

  derivedFn2 = () => {
    super.superFn2(123, 456);
  };

  async derivedFn3() {
    await super.superFn3();
  }

  derivedFn4() {
    super.superFn4();
  }
}
`;

describe('superMemberArrowFunction transform', () => {
  it('should replace `super` with <Super>.prototype', () => {
    const { code } = transformSync(fixture, {
      plugins: [superMemberArrowFunction, classProperties],
      babelrc: false,
      configFile: false,
    }) || { code: '' };

    expect(code).toMatch('await Super.prototype.superFn1.call(this);');
    expect(code).toMatch('Super.prototype.superFn2.call(this, 123, 456);');
    expect(code).toMatch('await super.superFn3()');
    expect(code).toMatch('super.superFn4()');
    expect(code).toMatchSnapshot();
  });
});
