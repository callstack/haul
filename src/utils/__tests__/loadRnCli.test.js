import subject from '../loadRnCli';

describe('for loadRnCli', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('extraPlatforms', () => {
    test('returns additional platforms from rn-cli.config.js', () => {
      jest.spyOn(subject, 'loadRnCli').mockImplementation(() => ({
        getPlatforms: () => ['test'],
      }));

      expect(subject.extraPlatforms()).toEqual(['test']);
    });

    test('returns an empty array when getPlatforms is not a function', () => {
      jest.spyOn(subject, 'loadRnCli').mockImplementation(() => ({}));

      expect(subject.extraPlatforms()).toEqual([]);
    });
  });

  describe('extraPlatformsDescriptions', () => {
    test('returns additional platforms from rn-cli.config.js', () => {
      jest.spyOn(subject, 'loadRnCli').mockImplementation(() => ({
        getPlatforms: () => ['test'],
      }));

      expect(subject.extraPlatformsDescriptions()).toEqual([
        { description: 'Builds test bundle', value: 'test' },
      ]);
    });

    test('returns an empty array when getPlatforms is not a function', () => {
      jest.spyOn(subject, 'loadRnCli').mockImplementation(() => ({}));

      expect(subject.extraPlatformsDescriptions()).toEqual([]);
    });
  });

  describe('extraProvidesModuleNodeModules', () => {
    test('returns additional node modules from rn-cli.config.js in reverse order', () => {
      jest.spyOn(subject, 'loadRnCli').mockImplementation(() => ({
        getProvidesModuleNodeModules: () => [
          'react-native',
          'react-native-test',
        ],
      }));

      expect(subject.extraProvidesModuleNodeModules()).toEqual([
        'react-native-test',
        'react-native',
      ]);
    });

    test('returns an empty array when getProvidesModuleNodeModules is not a function', () => {
      jest.spyOn(subject, 'loadRnCli').mockImplementation(() => ({}));

      expect(subject.extraProvidesModuleNodeModules()).toEqual([]);
    });
  });
});
