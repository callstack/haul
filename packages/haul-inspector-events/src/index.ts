export interface InspectorEvent {
  serialize(): string;
}

export class LoggerEvent implements InspectorEvent {
  constructor(private level: string, private args: unknown[]) {}
  serialize() {
    return JSON.stringify({
      type: 'LoggerEvent',
      level: this.level,
      args: this.args,
    });
  }
}
