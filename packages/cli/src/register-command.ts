import { Cli, CommandClass } from "clipanion";

export function RegisterCommand(cli: Cli) {
  return (commandClass: CommandClass<any>) => {
    cli.register(commandClass);
  };
}
