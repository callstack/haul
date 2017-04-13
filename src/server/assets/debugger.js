/* eslint-env browser */

'use strict';

(() => {
  function setStatus(status) {
    document.getElementById('status').innerHTML = status;
  }
  const isMacLike = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
  const refreshShortcut = isMacLike ? '⌘R' : 'Ctrl R';
  window.onload = () => {
    if (!isMacLike) {
      document.getElementById('dev_tools_shortcut').innerHTML = 'Ctrl⇧J';
    }
  };
  const INITIAL_MESSAGE = `Waiting, press <span class="shortcut">${refreshShortcut}</span> in simulator to reload and connect.`;
  function connectToDebuggerProxy() {
    let worker;
    const ws = new WebSocket(
      `ws://${window.location.host}/debugger-proxy?role=debugger&name=Chrome`,
    );
    function createJSRuntime() {
      // This worker will run the application javascript code,
      // making sure that it's run in an environment without a global
      // document, to make it consistent with the JSC executor environment.
      worker = new Worker('debugger.worker.js');
      worker.onmessage = ({ data }) => {
        ws.send(JSON.stringify(data));
      };
      window.onbeforeunload = () =>
        `If you reload this page, it is going to break the debugging session. You should press ${refreshShortcut} in simulator to reload.`;
      updateVisibility();
    }
    function shutdownJSRuntime() {
      if (worker) {
        worker.terminate();
        worker = null;
        window.onbeforeunload = null;
      }
    }
    function updateVisibility() {
      if (worker) {
        worker.postMessage({
          method: 'setDebuggerVisibility',
          visibilityState: document.visibilityState,
        });
      }
    }
    ws.onopen = () => {
      setStatus(INITIAL_MESSAGE);
    };
    ws.onmessage = ({ data }) => {
      if (!data) {
        return;
      }
      const object = JSON.parse(data);
      if (object.$event === 'client-disconnected') {
        shutdownJSRuntime();
        setStatus(
          `Waiting, press <span class="shortcut">${refreshShortcut}</span> in simulator to reload and connect.`,
        );
        return;
      }
      if (!object.method) {
        return;
      }
      // Special message that asks for a new JS runtime
      if (object.method === 'prepareJSRuntime') {
        shutdownJSRuntime();
        console.clear();
        createJSRuntime();
        ws.send(JSON.stringify({ replyID: object.id }));
        setStatus(`Debugger session #${object.id} active.`);
      } else if (object.method === '$disconnected') {
        shutdownJSRuntime();
        setStatus(INITIAL_MESSAGE);
      } else {
        // Otherwise, pass through to the worker.
        worker.postMessage(object);
      }
    };
    ws.onclose = ({ reason }) => {
      shutdownJSRuntime();
      setStatus(
        'Disconnected. Attempting to reconnect. Check if `haul` is running.',
      );
      if (reason) {
        setStatus(reason);
        console.warn(reason);
      }
      setTimeout(connectToDebuggerProxy, 500);
    };
    // Let debuggerWorker.js know when we're not visible so that we can warn about
    // poor performance when using remote debugging.
    document.addEventListener('visibilitychange', updateVisibility, false);
  }
  connectToDebuggerProxy();
})();
