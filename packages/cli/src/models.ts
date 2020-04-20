export interface HarkCliInitOptions {
  binaryLabel?: string;
  binaryName?: string;
  binaryVersion?: string;
  useDefaultHelpCommand?: boolean;
}

export interface HarkCliStartOptions<T extends Partial<BaseContext>> extends HarkCliInitOptions {
  context: T;
  harkfilePath?: string;
  registerBabelOptions?: null | {
    extensions: string[];
    [k:string]: unknown;
  };
}

export type CliCommandRegisterDecorator = (commandClass: CommandClass<any>) => void;

import { BaseContext, Cli, CommandClass } from "clipanion";

export type HarkfileFunction<CliContext, ReturnContext> = (input: {
  cli: Cli<CliContext & BaseContext>;
  cliRegister: CliCommandRegisterDecorator;
}) => Promise<ReturnContext> | ReturnContext;
