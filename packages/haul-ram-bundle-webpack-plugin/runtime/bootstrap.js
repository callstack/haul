function bootstrap(globalScope, options) { // eslint-disable-line
  const {
    bundleName,
    bundleId,
    mainModuleId,
    moduleMappings,
    preloadBundleNames,
    singleBundleMode,
  } = options;

  const BUNDLE_START_TIME = globalScope.nativePerformanceNow
    ? globalScope.nativePerformanceNow()
    : Date.now();
  if (singleBundleMode) {
    globalScope.__BUNDLE_START_TIME__ = BUNDLE_START_TIME;
  } else {
    globalScope.__BUNDLE_START_TIME__ = globalScope.__BUNDLE_START_TIME__ || {};
    globalScope.__BUNDLE_START_TIME__[bundleName] = BUNDLE_START_TIME;
  }

  for (const bundleName of preloadBundleNames) {
    if (!globalScope[bundleName]) {
      globalScope.bundleRegistryLoad(bundleName, true, true);
    }
  }

  // The module cache
  const installedModules = {};

  // The require function
  function __webpack_require__(moduleId) {
    // Check if module is in cache
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }
    // Create a new module (and put it into the cache)
    const module = (installedModules[moduleId] = {
      i: moduleId,
      l: false,
      exports: {},
    });

    // If moduleId is a string, map it to integer Id
    const moduleIntId =
      typeof moduleId === 'string'
        ? moduleMappings.modules[moduleId]
        : moduleId;

    // Load module on the native side
    if (singleBundleMode) {
      // Use 0 as a segementId to be compatible with RN 0.59.
      globalScope.nativeRequire(moduleIntId, 0);
    } else {
      globalScope.nativeRequire(moduleIntId, bundleId);
    }

    // Return the exports of the module
    return module.exports;
  }

  const __haul = {};
  globalScope[`__haul_${bundleName}`] = __haul;

  // Allow module to load itself into the module cache
  __haul.l = function loadSelf(moduleId, factory) {
    // Make sure module is in installedModules
    if (!installedModules[moduleId]) {
      throw new Error(moduleId + ' missing in module cache');
    }
    const module = installedModules[moduleId];
    factory.call(module.exports, module, module.exports, __webpack_require__);

    // Flag the module as loaded
    module.l = true;
  };
  __haul.l.name = `loadSelf_${bundleName}`;

  // The chunk loading function for additional chunks
  // With RAM format each async chunk is just another module
  __webpack_require__.e = function(chunkId) {
    return Promise.resolve().then(function() {
      const moduleIds = moduleMappings.chunks[chunkId];
      if (moduleIds === undefined) {
        throw new Error('No modules found for chunk with id ' + chunkId);
      }
      return undefined;
    });
  };

  // TODO: expose the modules object (__webpack_modules__)
  __webpack_require__.m = {};

  // expose the module cache
  __webpack_require__.c = installedModules;

  // define getter function for harmony exports
  __webpack_require__.d = function(exports, name, getter) {
    if (!__webpack_require__.o(exports, name)) {
      Object.defineProperty(exports, name, { enumerable: true, get: getter });
    }
  };

  // define __esModule on exports
  __webpack_require__.r = function(exports) {
    if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
      Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    }
    Object.defineProperty(exports, '__esModule', { value: true });
  };

  // create a fake namespace object
  // mode & 1: value is a module id, require it
  // mode & 2: merge all properties of value into the ns
  // mode & 4: return value when already ns object
  // mode & 8|1: behave like require
  __webpack_require__.t = function(value, mode) {
    if (mode & 1) value = __webpack_require__(value);
    if (mode & 8) return value;
    if (mode & 4 && typeof value === 'object' && value && value.__esModule)
      return value;
    var ns = Object.create(null);
    __webpack_require__.r(ns);
    Object.defineProperty(ns, 'default', { enumerable: true, value: value });
    if (mode & 2 && typeof value != 'string')
      for (var key in value)
        __webpack_require__.d(
          ns,
          key,
          function(key) {
            return value[key];
          }.bind(null, key)
        );
    return ns;
  };

  // getDefaultExport function for compatibility with non-harmony modules
  __webpack_require__.n = function(module) {
    const getter =
      module && module.__esModule
        ? function getDefault() {
            return module['default'];
          }
        : function getModuleExports() {
            return module;
          };
    __webpack_require__.d(getter, 'a', getter);
    return getter;
  };

  // Object.prototype.hasOwnProperty.call
  __webpack_require__.o = function(object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
  };

  // __webpack_public_path__
  __webpack_require__.p = '';

  // Load entry module and return exports
  return __webpack_require__((__webpack_require__.s = mainModuleId));
}
