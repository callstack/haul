import { Argv } from 'yargs';
import Runtime from '../Runtime';

export default function ramBundleCommand(runtime: Runtime) {
  return {
    command: 'ram-bundle',
    describe: 'Create ram-bundle',
    builder(yargs: Argv) {
      return yargs;
    },
    handler(argv: any) {
      runtime.logger.info(argv);
      runtime.complete();
    },
  };
}
