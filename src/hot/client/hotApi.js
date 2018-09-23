/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

/**
 * Original code was written by Dan Abramov - https://github.com/gaearon/react-hot-loader/
 */

// eslint-disable-next-line
import React, { Component } from 'react';
import deepForceUpdate from 'react-deep-force-update';
import hoistNonReactStatic from 'hoist-non-react-statics';
import resetRedBox from './utils';

const instances = {};
const pendingRedraws = {};

type State = {
  error: ?Object,
};

/**
 * Wrap root component factory with custom HotWrapper, which allows for deep force update
 * and servers as an error boundary.
 */
export function makeHot(initialRootFactory: Function, id?: string = 'default') {
  instances[id] = [];

  return () => {
    class HotWrapper extends Component<*, State> {
      state = {
        error: null,
      };

      rootComponentFactory: ?Function;

      constructor(props: *) {
        super(props);

        const pendingRedraw = pendingRedraws[id];
        delete pendingRedraws[id];

        instances[id].push(this);
        this.rootComponentFactory = pendingRedraw || null;
      }

      _resetError() {
        this.setState({ error: null });
        resetRedBox();
      }

      _redraw(rootComponentFactory?: Function) {
        if (rootComponentFactory) {
          this.rootComponentFactory = rootComponentFactory;
        }

        this._resetError();
        deepForceUpdate(this);
      }

      componentWillReceiveProps() {
        this._resetError();
        deepForceUpdate(this);
      }

      componentWillUnmount() {
        instances[id] = instances[id].filter(instance => instance !== this);
      }

      componentDidCatch(error: Object) {
        this.setState({
          error,
        });
      }

      render() {
        if (this.state.error) {
          console.error(this.state.error);
          return null;
        }

        const Root = this.rootComponentFactory
          ? this.rootComponentFactory()
          : initialRootFactory();
        return <Root {...this.props} />;
      }
    }

    return hoistNonReactStatic(HotWrapper, initialRootFactory());
  };
}

/**
 * Redraw wrapped component with a new root component factory.
 */
export function redraw(
  rootComponentFactory: Function,
  id?: string = 'default'
) {
  if (instances[id].length) {
    instances[id].forEach(instance => instance._redraw(rootComponentFactory));
  } else {
    pendingRedraws[id] = rootComponentFactory;
  }
}

/**
 * Try redrawing the component defined in root file, which accepts child modules and
 * triggers `redraw`.
 */
export function tryUpdateSelf() {
  Object.keys(instances).forEach(id => {
    setTimeout(() => {
      instances[id].forEach(instance => instance._redraw());
    }, 0);
  });
}

/**
 * Helper function for executing code in callback only once, since if module updates itself
 * it will be reevaluated, so anything outside this function will be called again.
 */
export function callOnce(callback: Function) {
  if (!global.__HAUL_HMR__.isInitialised) {
    callback();
    global.__HAUL_HMR__.isInitialised = true;
  }
}

/**
 * Clear specified module cache. The module must be a resolved with `require.resolve`.
 *
 */
export function clearCacheFor(resolvedModuleName: string) {
  delete require.cache[resolvedModuleName];
}
