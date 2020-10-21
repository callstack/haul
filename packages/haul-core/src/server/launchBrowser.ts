import open from 'open';
import select from 'platform-select';
import Runtime from '../runtime/Runtime';

/**
 * Launches given `url` in browser based on platform
 */
export default function launchBrowser(runtime: Runtime, url: string) {
  const openWith = (app: string) => () => open(url, { app });

  /**
   * Run Chrome (Chrome Canary) or supported platform.
   * In case of macOS, we can eventually fallback to Safari.
   *
   * select(attempt1, attempt2, attempt3,...) // attempt to run is from left to right
   */
  const resolutions: Record<string, ReturnType<typeof openWith>>[] = [
    {
      // Try to find & run Google Chrome
      darwin: openWith('google chrome'),
      win32: openWith('chrome'),
      _: openWith('google-chrome'),
    },
    {
      // On macOS let's try to find & run Canary
      darwin: openWith('google chrome canary'),
    },
    {
      // No Canary / Chrome, let's run Safari
      darwin: openWith('safari'),
    },
  ];

  // If the user has provided a specific browser preference, try that one first.
  if (process.env.RCT_DEBUGGER_BROWSER) {
    resolutions.unshift({
      _: openWith(process.env.RCT_DEBUGGER_BROWSER),
    });
  }

  select(resolutions).catch((error: Error) => {
    runtime.logger.warn(
      `Cannot start browser for debugging. Navigate manually to "${url}": ${error.message}`
    );
  });
}
