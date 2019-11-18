const Status = {
  INITIAL: () => '<span class="circle circle-green"></span> Waiting',
  DEBUGGER_DISCONNECTED: () =>
    '<span class="circle circle-red"></span> Disconnected. <br/> Attempting to reconnect. ' +
      'Check if <b>HAUL</b> is running.',
  CLIENT_DISCONNECTED: (refreshShortcut) =>
    `<span style="circle circle-green"</span> Waiting <br/> Press <span class="shortcut">${
      refreshShortcut
    }</span> in simulator to reload and connect.`,
  SESSION_ACTIVE: (id) => `Debugger session #${id} active.`,
  ERROR: (error) => error,
}

class DebuggerManager {
  constructor({ setStatus, toggler, refreshShortcut }) {
    this.setStatus = setStatus;
    this.toggler = toggler;
    this.refreshShortcut = refreshShortcut;

    this.worker = null;
    this.ws = null;

    // Let debuggerWorker.js know when we're not visible so that we can warn about
    // poor performance when using remote debugging.
    document.addEventListener('visibilitychange', this.updateVisibility.bind(this), false);
  }

  init() {
    this.ws = new WebSocket(`ws://${window.location.host}/debugger-proxy?role=debugger&name=Chrome`);
    this.ws.onopen = () => {
      this.updateStatus(Status.INITIAL());
    };
    this.ws.onmessage = (message) => {
      if (!message.data) {
        return;
      }
      const command = JSON.parse(message.data);
      this.handleCommand(command);
    };
    this.ws.onclose = (error) => {
      this.stop();
      this.updateStatus(Status.DEBUGGER_DISCONNECTED());
      if (error.reason) {
        console.warn(error.reason);
        this.updateStatus(Status.ERROR(error.reason));
      }
      setTimeout(() => {
        this.init();
      }, 500);
    };
  }

  start() {
    // This worker will run the application javascript code,
    // making sure that it's run in an environment without a global
    // document, to make it consistent with the JSC executor environment.
    this.worker = new Worker('/debugger-ui/debuggerWorker.js');
    this.worker.onmessage = (message) => {
      this.ws.send(JSON.stringify(message.data));
    };

    window.onbeforeunload = () => {
      return 'If you reload this page, it is going to break the debugging session. ' +
        'You should press' + this.refreshShortcut + 'in simulator to reload.';
    };

    this.updateVisibility();
  }

  stop() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      window.onbeforeunload = null;
    }
  }

  handleCommand(command) {
    if (command.$event === 'client-disconnected') {
      this.stop();
      this.updateStatus(Status.CLIENT_DISCONNECTED(this.refreshShortcut));
      return;
    }

    if (!command.method) {
      return;
    }

    switch (command.method) {
      case 'prepareJSRuntime': {
        this.stop();
        console.clear();
        this.start();
        this.ws.send(JSON.stringify({ replyID: command.id }));
        this.updateStatus(Status.SESSION_ACTIVE(command.id));
        break;
      }
      case '$disconnected': {
        this.stop();
        this.updateStatus(Status.INITIAL());
        break;
      }
      default: {
        // Otherwise, pass through to the worker.
        if (this.worker) {
          this.worker.postMessage(command);
        }
      }
    }
  }

  updateVisibility() {
    if (this.worker && this.toggler && !this.toggler.checked) {
      this.worker.postMessage({
        method: 'setDebuggerVisibility',
        visibilityState: document.visibilityState,
      });
    }
  }

  updateStatus(statusMessage) {
    this.setStatus(statusMessage);
  }
}
