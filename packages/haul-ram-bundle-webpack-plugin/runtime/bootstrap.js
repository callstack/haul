function bootstraper(globalScope, mainId, moduleMappings) { // eslint-disable-line
  var ID_MASK_SHIFT = 16;
  var LOCAL_ID_MASK = ~0 >>> ID_MASK_SHIFT;

  function unpackModuleId(moduleId) {
    var segmentId = moduleId >>> ID_MASK_SHIFT;
    var localId = moduleId & LOCAL_ID_MASK;
    return {
      segmentId: segmentId,
      localId: localId,
    };
  }

  // The module cache
  var installedModules = {};

  // The require function
  function __webpack_require__(moduleId) {
    // Check if module is in cache
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }
    // Create a new module (and put it into the cache)
    var module = (installedModules[moduleId] = {
      i: moduleId,
      l: false,
      exports: {},
    });

    // If moduleId is a string, map it to integer Id
    var moduleIntId =
      typeof moduleId === 'string'
        ? moduleMappings.modules[moduleId]
        : moduleId;

    // Load module on the native side
    var unpackedModule = unpackModuleId(moduleIntId);
    globalScope.nativeRequire(unpackedModule.localId, unpackedModule.segmentId);

    // Return the exports of the module
    return module.exports;
  }

  // Export __webpack_require__ globally
  globalScope.__webpack_require__ = __webpack_require__;

  // Allow module to load itself into the module cache
  __webpack_require__.loadSelf = function loadSelf(moduleId, factory) {
    // Make sure module is in installedModules
    if (!installedModules[moduleId]) {
      throw new Error(moduleId + ' missing in module cache');
    }
    var module = installedModules[moduleId];
    factory.call(globalScope, module, module.exports, __webpack_require__);

    // Flag the module as loaded
    module.l = true;
  };

  // The chunk loading function for additional chunks
  // With RAM format each async chunk is just another module
  __webpack_require__.e = function(chunkId) {
    return Promise.resolve().then(function() {
      var moduleIds = moduleMappings.chunks[chunkId];
      for (var i = 0; i < moduleIds.length; i++) {
        __webpack_require__(moduleIds[i]);
      }
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
    var getter =
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
  return __webpack_require__((__webpack_require__.s = mainId));
}
