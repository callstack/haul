import { BundleType } from '../types';

export type ExternalBundleProperties = {
  type: BundleType;
  bundlePath: string;
  assetsPath: string;
  manifestPath: string;
  shouldCopy: boolean;
  dependsOn?: string[];
};

export class ExternalBundle {
  constructor(
    public name: string,
    public properties: ExternalBundleProperties
  ) {}
}
