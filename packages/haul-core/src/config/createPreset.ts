import { PresetBuilder, EnvOptions, HaulConfig } from './types';
import Runtime from '../runtime/Runtime';

export default function createPreset(builder: PresetBuilder): PresetBuilder {
  return (haulConfig: HaulConfig) => (
    runtime: Runtime,
    options: EnvOptions
  ) => {
    return builder(haulConfig)(runtime, options);
  };
}
