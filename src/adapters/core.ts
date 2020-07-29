import * as core from '@actions/core';
export * as core from '@actions/core'

export interface ActionsCore {
  getInput(name: string, options?: core.InputOptions): string
  debug(message: string): void;
  info(message: string | Error): void
  warning(message: string | Error): void;
  addPath(inputPath: string): void;
}
