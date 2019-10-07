import EventEmitter from 'react-native/Libraries/vendor/emitter/EventEmitter';
import BatchedBridge from 'react-native/Libraries/BatchedBridge/BatchedBridge';

class BundleRegistry extends EventEmitter {
  _loadStartTimestamp = {};
  _print = () => {};

  constructor() {
    super();
    BatchedBridge.registerCallableModule('BundleRegistry', {
      bundleRegistryOnLoad: (bundleName) => {
        this._bundleRegistryOnLoad(bundleName);
      },
    });
  }

  enableLogging() {
    this._print = (...args) => {
      console.log('BundleRegistry:', ...args);
    };
  }

  disableLogging() {
    this._print = () => {};
  }

  _bundleRegistryOnLoad(bundleName) {
    this._print(`bundle '${bundleName}' loaded, emitting 'bundleLoaded' event`);
    this.emit('bundleLoaded', {
      bundleName,
      loadStartTimestamp: this._loadStartTimestamp[bundleName],
    });
  }

  loadBundle(bundleName, synchronously = false) {
    this._loadStartTimestamp[bundleName] = Date.now();
    const isBundleLoaded = this.isBundleLoaded(bundleName);

    this._print(
      `request to load '${bundleName}' received at '${new Date(
        this._loadStartTimestamp[bundleName],
      ).toLocaleTimeString()}'`,
    );

    if (!isBundleLoaded) {
      this._print(
        `bundle '${bundleName}' not available - loading ${
          synchronously ? 'synchronously' : 'asynchronously'
        }`,
      );
      global.bundleRegistryLoad(bundleName, synchronously, true);
    }

    if (isBundleLoaded || synchronously) {
      this._print(`bundle '${bundleName}' already loaded`);
      this._bundleRegistryOnLoad(bundleName);
    }
  }

  isBundleLoaded(bundleName) {
    return Boolean(global[bundleName]);
  }

  getBundleExport(bundleName) {
    if (!this.isBundleLoaded(bundleName)) {
      throw new Error(`Bundle ${bundleName} was not loaded`);
    }
    return global[bundleName].default;
  }
}

export default new BundleRegistry();
