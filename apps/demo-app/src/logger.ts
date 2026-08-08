export class ConsoleLogger {
  constructor() {
    this.log('constructing ConsoleLogger...');
  }

  log(...data: any[]) {
    console.log(...data);
  }
}
