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
