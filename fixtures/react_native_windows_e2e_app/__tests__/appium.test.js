import wd from 'wd';
import execa from 'execa';

jest.setTimeout(60000);
const PORT = 4723;
const config = {
  platformName: 'Windows',
  deviceName: 'WindowsPC',
};
const driver = wd.promiseChainRemote('localhost', PORT);
let appiumServer = { cancel() {} };

beforeAll(async () => {
  appiumServer = execa.command('yarn run appium');
  await new Promise(resolve => setTimeout(resolve, 4000));

  await driver.init({ ...config, app: 'Root' });
  await driver.sleep(2000);

  console.log('Getting RNWTestApp native window handle');
  const testAppWindow = await driver.elementByName('RNWTestApp');
  const testAppWindowHandle = await testAppWindow.getAttribute('NativeWindowHandle');
  const testAppHandle = parseInt(testAppWindowHandle, 10).toString(16);

  console.log('Initializing new session with top level window', testAppHandle);
  await driver.init({
    ...config,
    appTopLevelWindow: testAppHandle.toLowerCase(),
  });
  await driver.sleep(2000);
});

afterAll(async () => {
  await driver.quit();
  appiumServer.cancel();
});

async function getByTestId(testId) {
  const element = await driver.waitForElementByAccessibilityId(testId);
  console.log('Found element', testId);
  return element;
}

test('RNWTestApp renders correctly', async () => {
  (await getByTestId('navigateToInitial')).click();
  await driver.sleep(1000);

  expect(await getByTestId('emptyHost')).toBeDefined();
  (await getByTestId('navigateToapp0')).click();
  await driver.sleep(1000);

  expect(await getByTestId('app0')).toBeDefined();
  expect(await (await getByTestId('app0LoadTime')).text()).toMatch(/Load time: ([1-9]|[0-9]{2}) ms/);

  (await getByTestId('navigateToapp1')).click();
  await driver.sleep(1000);

  expect(await getByTestId('app1')).toBeDefined();
  expect(await (await getByTestId('app1LoadTime')).text()).toMatch(/Load time: ([1-9]|[0-9]{2}) ms/);
  
  await driver.sleep(2000);
  expect(await getByTestId('exchangeRates')).toBeDefined();
});