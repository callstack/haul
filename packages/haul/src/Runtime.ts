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
}
