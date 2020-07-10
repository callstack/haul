import { BundleType } from '../types';

export type ExternalBundleProperties = {
  /** Type of the bundle. */
  type: BundleType;
  /** Absolute path to where the bundle is located. */
  bundlePath: string;
  /** Absolute path to where the assets for the bundle are located. */
  assetsPath: string;
  /** Absolute path to where the manifest file is located. */
  manifestPath?: string;
  /** Whether to copy the bundle and it's assets to output directory. */
  shouldCopy: boolean;
  /** What other bundles, this one depends on if any. */
  dependsOn?: string[];
};

/**
 * Class representing external (pre-built) bundle.
 */
export class ExternalBundle {
  /**
   * Checks if the given object is an instance of `ExternalBundle`.
   * It handles cases where using `instanceof` might fail.
   *
   * @param bundle Object to check.
   */
  static isExternal(bundle: any): bundle is ExternalBundle {
    return (
      bundle instanceof ExternalBundle ||
      bundle?.constructor?.name === ExternalBundle.name ||
      bundle?.__proto__?.constructor?.name === ExternalBundle.name
    );
  }

  /**
   * Constructs new `ExternalBundle`.
   *
   * @param name Bundle name.
   * @param properties External bundle properties.
   */
  constructor(
    public name: string,
    public properties: ExternalBundleProperties
  ) {}
}
