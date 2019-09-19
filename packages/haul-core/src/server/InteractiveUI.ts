import { Terminal } from 'terminal-kit';
import { container, color, modifier, pad } from 'ansi-fragments';
import wrapAnsi from 'wrap-ansi';
import UserInterface from './UI';

class Logs {
  autoFollow: boolean = true;
  sliceStart: number = 0;
  sliceMaxLength: number = 0;
  maxLineWidth: number = 0;
  private lines: string[] = [];

  get length() {
    return this.lines.length;
  }

  getSlice() {
    return this.lines.slice(
      this.sliceStart,
      this.sliceStart + this.sliceMaxLength
    );
  }

  clear() {
    this.lines = [];
  }

  addItem(item: string) {
    const lines = item.split('\n').reduce(
      (acc, line) => {
        const wrappedLine = wrapAnsi(line, this.maxLineWidth, {
          hard: true,
        });
        return acc.concat(...wrappedLine.split('\n'));
      },
      [] as string[]
    );

    this.lines.push(...lines);

    if (this.length > this.sliceMaxLength && this.autoFollow) {
      this.sliceStart = this.length - this.sliceMaxLength;
    }
  }
}

export default class InteractiveUserInterface implements UserInterface {
  private terminal: Terminal;
  private logs: Logs = new Logs();
  private compilations: {
    [platform: string]: {
      value: number;
      title: string;
      x: number;
      y: number;
      running: boolean;
      width: number;
    };
  } = {};
  private LOGS_START_Y = 3;

  constructor(terminal: Terminal) {
    this.terminal = terminal;
  }

  renderLogsSection() {
    this.terminal.moveTo(0, 0);
    this.terminal.eraseLine();
    this.terminal(
      container(
        color('gray', '['),
        color('blue', modifier('bold', 'Logs')),
        color('gray', ']')
      ).build()
    );
  }

  renderCompilationsSection(platforms: string[]) {
    this.terminal.moveTo(0, this.terminal.height - platforms.length - 2);
    this.terminal(
      container(
        color('gray', '['),
        color('blue', modifier('bold', 'Compilations')),
        color('gray', ']')
      ).build()
    );
  }

  createCompilations(platforms: string[]) {
    const leftMargin = 4;
    const platformNameLength = Math.max(
      ...platforms.map(platform => platform.length)
    );

    platforms.forEach((platform, index) => {
      this.compilations[platform] = {
        width: Math.min(110, this.terminal.width) - (platformNameLength + 22),
        value: 0,
        title: `${' '.repeat(
          platformNameLength - platform.length
        )}${platform.toUpperCase()}:`,
        x: leftMargin,
        y: this.terminal.height - platforms.length + index,
        running: false,
      };
    });
  }

  renderCompilationsProgress() {
    Object.keys(this.compilations).forEach(platform => {
      const compilation = this.compilations[platform];
      this.terminal.moveTo(compilation.x, compilation.y);
      this.terminal.eraseLine();
      this.terminal(
        color('magenta', modifier('bold', compilation.title), pad(1)).build()
      );

      const barWidth = Math.max(
        0,
        Math.floor(compilation.value * compilation.width)
      );
      this.terminal(
        container(
          compilation.running ? 'running' : '   idle',
          pad(1),
          '[',
          '='.repeat(barWidth),
          '>',
          ' '.repeat(compilation.width - barWidth),
          ']',
          pad(1),
          color('yellow', `${Math.floor(compilation.value * 100)}%`)
        ).build()
      );
    });
  }

  updateCompilationProgress(
    platform: string,
    { running, value }: { running: boolean; value: number }
  ) {
    this.compilations[platform].running = running;
    this.compilations[platform].value = Math.min(1, value);
    this.renderCompilationsProgress();
  }

  renderLogs() {
    this.terminal.moveTo(0, this.LOGS_START_Y);
    this.logs.getSlice().forEach((log, index) => {
      this.terminal.moveTo(0, this.LOGS_START_Y + index);
      this.terminal.eraseLine();
      this.terminal(log);
    });
  }

  addLogItem(item: string) {
    this.logs.addItem(item);
    if (this.logs.length < this.logs.sliceMaxLength || this.logs.autoFollow) {
      this.renderLogs();
    }
    this.renderLogsSection();
  }

  dispose(exitCode: number = 0, exit: boolean = true) {
    this.terminal.grabInput(false);
    this.terminal.hideCursor(false);
    this.terminal.fullscreen(false);
    if (exit) {
      this.terminal.processExit(exitCode);
    }
  }

  start(platforms: string[]) {
    this.logs.sliceStart = 0;
    this.logs.sliceMaxLength = this.terminal.height - platforms.length - 6;
    this.logs.maxLineWidth = this.terminal.width - 2;

    this.terminal.fullscreen(true);
    this.terminal.grabInput({ mouse: 'motion' });
    this.terminal.hideCursor();

    this.terminal.on('mouse', (name: string) => {
      if (this.logs.length > this.logs.sliceMaxLength) {
        if (name === 'MOUSE_WHEEL_UP') {
          this.logs.sliceStart = Math.max(0, this.logs.sliceStart - 1);
          this.logs.autoFollow = false;
          this.renderLogs();
        } else if (name === 'MOUSE_WHEEL_DOWN') {
          this.logs.sliceStart = Math.min(
            this.logs.length - this.logs.sliceMaxLength,
            this.logs.sliceStart + 1
          );
          if (
            this.logs.sliceStart + this.logs.sliceMaxLength ===
            this.logs.length
          ) {
            this.logs.autoFollow = true;
          }
          this.renderLogs();
          this.renderLogsSection();
        }
      }
    });

    this.terminal.on('key', (name: string) => {
      if (name === 'CTRL_C') {
        this.dispose();
      }
    });

    this.terminal.on('resize', (width: number, height: number) => {
      this.terminal.clear();
      this.logs.sliceMaxLength = height - platforms.length - 6;
      this.logs.maxLineWidth = width - 10;
      this.logs.clear();
      // eslint-disable-next-line no-console
      console.log('Logs cleared due to terminal resize');
      this.renderLogsSection();
      this.renderLogs();
      const platformNameLength = Math.max(
        ...platforms.map(platform => platform.length)
      );
      Object.keys(this.compilations).forEach(platform => {
        this.compilations[platform].width =
          Math.min(110, this.terminal.width) - (platformNameLength + 20);
      });
      this.renderCompilationsSection(platforms);
      this.renderCompilationsProgress();
    });

    this.renderLogsSection();
    this.renderLogs();
    this.createCompilations(platforms);
    this.renderCompilationsSection(platforms);
    this.renderCompilationsProgress();
  }
}
