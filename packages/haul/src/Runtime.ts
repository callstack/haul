import { RuntimeCompleteEvent } from 'haul-inspector-events';
import InspectorClient from './InspectorClient';
import Logger from './Logger';

export default class Runtime {
  logger: Logger;

  constructor(private inspectorClient?: InspectorClient) {
    this.logger = new Logger(inspectorClient);
  }

  async ready(waitForInspector: boolean = false): Promise<void> {
    if (waitForInspector && this.inspectorClient) {
      await this.inspectorClient.ready();
    }
  }

  complete(exitCode: number = 0) {
    process.exitCode = exitCode;
    if (this.inspectorClient) {
      this.inspectorClient.emitEvent(new RuntimeCompleteEvent(exitCode));
      this.inspectorClient.close();
    }
  }
}
