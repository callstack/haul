import message from '../bundleBuilt';

const statsWithWithoutWarnings = {
  toJson: () => ({
    time: 1000.0203,
    warnings: [],
  }),
  hasWarnings: () => false,
};

const statsWithWithWarnings = {
  toJson: () => ({
    children: [
      {
        time: 1000.21312,
      },
      {
        time: 2300.123,
      },
    ],
    warnings: ['warn1', 'warn2'],
  }),
  hasWarnings: () => true,
};

describe('message bundleBuild for all platforms', () => {
  beforeEach(() => {
    require('chalk').enabled = false;
  });

  it('should match the snapshot without warnings', () => {
    expect(
      message({ stats: statsWithWithoutWarnings, platform: 'all' })
    ).toMatchSnapshot();
  });

  it('should match the snapshot with warnings', () => {
    expect(
      message({ stats: statsWithWithWarnings, platform: 'all' })
    ).toMatchSnapshot();
  });
});
