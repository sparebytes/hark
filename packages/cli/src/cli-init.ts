import { HarkCliInitOptions } from "./models";
import { RegisterCommand } from "./register-command";

export async function cliInit(options?: HarkCliInitOptions) {
  const { Cli, Command } = await import("clipanion");
  const cli = new Cli({
    binaryLabel: options?.binaryLabel ?? `Hark`,
    binaryName: options?.binaryName ?? `hark`,
    binaryVersion: options?.binaryVersion ?? `0.0.0-unknown`,
  });
  const cliRegister = RegisterCommand(cli);

  class HelpCommand extends Command {
    @Command.Path(`--help`)
    @Command.Path(`-h`)
    async execute() {
      this.context.stdout.write(this.cli.usage(null));
    }
  }

  if (options?.useDefaultHelpCommand ?? true) {
    cli.register(HelpCommand);
  }

  return {
    cli,
    cliRegister,
  };
}
