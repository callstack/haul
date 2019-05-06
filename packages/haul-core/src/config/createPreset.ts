import { PresetBuilder, EnvOptions, HaulConfigBuilder } from './types';
import Runtime from '../runtime/Runtime';

export default function createPreset(builder: PresetBuilder): PresetBuilder {
  return (haulConfigBuilder: HaulConfigBuilder) => (
    runtime: Runtime,
    options: EnvOptions
  ) => {
    const haulConfig =
      typeof haulConfigBuilder === 'function'
        ? haulConfigBuilder(options)
        : haulConfigBuilder;
    return builder(haulConfig)(runtime, options);
  };
}
