module.exports = {
  preset: 'react-native',
  setupFiles: [require.resolve('react-native/jest/setup')],
  setupFilesAfterEnv: [require.resolve('jest-enzyme/lib')],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|react-clone-referenced-element|react-navigation|@react-navigation|@react-native-community)',
  ],
  testMatch: ['<rootDir>/**/__tests__/**/*[.-_](spec|test).[tj]s?(x)'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
    '.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|dds|ogg|json.resource)$':
      require.resolve('react-native/jest/assetFileTransformer.js'),
  },
  // FIXME: fix jest so this manual line isn't necessary
  rootDir: '../..'
};
