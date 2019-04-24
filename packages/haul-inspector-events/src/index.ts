export interface InspectorEvent {
  serialize(): string;
}

export class LoggerEvent implements InspectorEvent {
  static parse(data: string) {
    const { level, args } = JSON.parse(data);
    return new LoggerEvent(level, args);
  }

  constructor(private level: string, private args: unknown[]) {}
  serialize() {
    return JSON.stringify({
      type: 'LoggerEvent',
      level: this.level,
      args: this.args,
    });
  }
}

export class RuntimeCompleteEvent implements InspectorEvent {
  constructor(private exitCode: number) {}
  serialize() {
    return JSON.stringify({
      type: 'RuntimeCompleteEvent',
      exitCode: this.exitCode,
    });
  }
}

export class RuntimeCommandStartEvent implements InspectorEvent {
  constructor(private command: string, private argv: string[]) {}
  serialize() {
    return JSON.stringify({
      type: 'RuntimeCommandStartEvent',
      command: this.command,
      argv: this.argv,
    });
  }
}

export class RuntimeUnhandledErrorEvent implements InspectorEvent {
  constructor(private error: string | Error) {}
  serialize() {
    return JSON.stringify({
      type: 'RuntimeUnhandledErrorEvent',
      error: this.error,
    });
  }
}

export class RuntimeNodeInspectorStartedEvent implements InspectorEvent {
  constructor(private wait: boolean) {}
  serialize() {
    return JSON.stringify({
      type: 'RuntimeNodeInspectorStartedEvent',
      wait: this.wait,
    });
  }
}
