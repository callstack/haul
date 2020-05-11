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
let appiumLog = "";

// beforeAll(async (done) => {
//   appiumServer = execa.command('yarn run appium');
//   appiumServer.stdout.on('data', (data) => { appiumLog += data; });
//   const t = new Date().getTime();
//   await new Promise(resolve => setTimeout(resolve, 4000));
//   console.log(new Date().getTime() - t);

//   await driver.init({ ...config, app: 'Root' });
//   await driver.sleep(2000);

//   console.log('Getting RNWTestApp native window handle');
//   const testAppWindow = await driver.elementByName('RNWTestApp');
//   const testAppWindowHandle = await testAppWindow.getAttribute('NativeWindowHandle');
//   const testAppHandle = parseInt(testAppWindowHandle, 10).toString(16);

//   console.log('Initializing new session with top level window', testAppHandle);
//   await driver.init({
//     ...config,
//     appTopLevelWindow: testAppHandle.toLowerCase(),
//   });
//   await driver.sleep(2000);
//   done();
// });
// 
// afterAll(async () => {
//   console.log('Appium log:');
//   console.log(appiumLog);
//   await driver.quit();
//   appiumServer.cancel();
// });

async function getByTestId(testId) {
  const element = await driver.waitForElementByAccessibilityId(testId);
  console.log('Found element', testId);
  return element;
}

test('RNWTestApp renders correctly', async () => {
  // Setup
  appiumServer = execa.command('yarn run appium');
  appiumServer.stdout.on('data', (data) => { console.log(`--> Appium: ${data}`); appiumLog += data.toString('utf8'); });
  const t = new Date().getTime();
  await new Promise(resolve => setTimeout(resolve, 30000));
  console.log(new Date().getTime() - t);

  console.log('test start');
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

  // Test
  console.log('test start');
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

  expect(await getByTestId('films')).toBeDefined();

  // Teardown
  console.log('Appium log:');
  console.log(appiumLog);
  await driver.quit();
  appiumServer.cancel();
}, 120000);