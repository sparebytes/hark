import { makeHarkMonorepoCommands } from "@hark/clipanion";
import { OpinionatedMonorepo, OpinionatedPackage, OpinionatedRootProject } from "@hark/opinionated";
import { plugin } from "@hark/plugin";
import { monorepoBuilderPlugin } from "@hark/plugin-monorepo";
import reporterVerbose from "@hark/reporter-verbose";
import { Cli, Command } from "clipanion";

export const monorepoBuilder = monorepoBuilderPlugin(
  ["foo", "bar"],
  plugin.map(({ packages }) => {
    const packageProjects = packages.map((p) => {
      const name = p.packageJson.name;
      const myPackage = new OpinionatedPackage(name, p.path);
      return myPackage;
    });
    const projects = [new OpinionatedRootProject(), ...packageProjects];
    const myMonorepo = new OpinionatedMonorepo(projects);
    return myMonorepo;
  }),
);

export const runCli = (args: string[]) => {
  //
  // Root Monad
  //
  const topPackage = require("./package.json");
  const rootMonad = plugin.monadRoot(reporterVerbose({ logLevel: 2 }), [], {
    version: topPackage.version as string,
    gitRepositoryUrl: topPackage?.repository?.url,
    devDebounceTime: 100,
    release: false,
    watchMode: false,
  });

  //
  // CLI
  //
  const cli = new Cli({ binaryLabel: "Hark", binaryName: "hark" });

  // Help - CLI
  class HelpCommand extends Command {
    @Command.Path(`--help`)
    @Command.Path(`-h`)
    async execute() {
      this.context.stdout.write(this.cli.usage(null));
    }
  }
  cli.register(HelpCommand);

  // Monorepo - CLI
  makeHarkMonorepoCommands({
    monorepoBuilder,
    rootMonad,
    autoRegisterCommands: true,
    cli,
  });

  // Run
  return cli.run(args, { ...Cli.defaultContext });
};
