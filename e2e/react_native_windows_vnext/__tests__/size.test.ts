import createSizeTestSuite from '../../utils/createSizeTestSuite';

createSizeTestSuite('react_native_windows_vnext', 'windows', {
  min: 600,
  // RNW current has chakra: true flag in babel.config.js, meaning additional (required) transforms
  // are included, hence the bigger bundle size compared to iOS/Android.
  maxIndexBundle: 950,
  maxBaseBundle: 1145,
});
