import findProvidesModule from '../findProvidesModule';

jest.mock('fs');

describe('for findProvidesModule', () => {
  afterEach(() => {
    require('fs').__reset();
    jest.restoreAllMocks();
  });

  describe('when there are unique modules', () => {
    beforeEach(() => {
      require('fs').__setMockFiles({
        '/web/file1.web.js':
          '/* @providesModule File1 */ console.log("file1 contents");',
        '/web/file2.web.js':
          '/* @providesModule File2 */ console.log("file2 contents");',
        '/web/file3.web.js': 'console.log("file3 contents");',
      });
    });

    test('returns a module map of haste modules', () => {
      const directories = ['/web'];
      const modulesMap = findProvidesModule(directories, {
        platforms: ['web'],
      });
      expect(modulesMap).toEqual({ File1: '/web/file1', File2: '/web/file2' });
    });
  });

  describe('when there are not unique modules', () => {
    beforeEach(() => {
      require('fs').__setMockFiles({
        '/web/file1.web.js':
          '/* @providesModule File1 */ console.log("file1 contents");',
        '/web/file2.web.js':
          '/* @providesModule File2 */ console.log("file2 contents");',
        '/web/file3.web.js':
          '/* @providesModule File2 */ console.log("file3 contents");',
      });
    });

    test('returns a module map of haste modules with the first found entry', () => {
      const directories = ['/web'];
      const modulesMap = findProvidesModule(directories, {
        platforms: ['web'],
      });
      expect(modulesMap).toEqual({ File1: '/web/file1', File2: '/web/file2' });
    });
  });
});
