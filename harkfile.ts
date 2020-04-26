import { TransformOptions } from "@babel/core";
import { makeCli } from "@hark/cli";
import { HarkMonorepoBaseCommand, makeHarkMonorepoCommands } from "@hark/clipanion";
import { copyPackageJson, opinionatedFactory, OpinionatedProjectTaskContext, OpinionatedProjectTasks } from "@hark/opinionated";
import { plugin } from "@hark/plugin";
import copy from "@hark/plugin-copy";
import find from "@hark/plugin-find";
import { monorepoBuilderPlugin } from "@hark/plugin-monorepo";
import spawn from "@hark/plugin-spawn";
import { Cli, Command } from "clipanion";
import { last, map } from "rxjs/operators";

interface MyTaskContext extends OpinionatedProjectTaskContext {}
interface MyTasks extends OpinionatedProjectTasks {}

const {
  //
  MyProject,
  MyPackage,
  MyRootProject,
  MyMonorepo,
} = opinionatedFactory<MyTaskContext, MyTasks>({
  project() {},

  package() {
    // prepare
    this.registerTask("prepare", (gc) =>
      gc.watchMode
        ? plugin.throwError("Cannot prepare in watch mode!")
        : plugin.pipe(
            //
            copyPackageJson({
              gitRepositoryUrl: gc.gitRepositoryUrl,
              path: `${this.path}/package.json`,
              writeDir: `${this.path}/dist`,
              watchMode: false,
            }),
            last(),
            find([`${this.path}/bin/**/*`], { onlyFiles: true }),
            copy(`${this.path}/dist/bin`),
            find([`${this.path}/dist/**/*`], { onlyFiles: true }),
            copy("release/packages"),
          ),
    );
  },

  rootProject() {
    this.registerTask("prepare", function (gc) {
      return gc.watchMode
        ? plugin.throwError("Cannot prepare in watch mode!")
        : plugin.pipe(
            //
            plugin.log("Cleaning"),
            this.monorepo.tasks.clean(plugin.of(null)).combineLatestArray(),
            last(),
            this.task.buildRoot(),
            last(),
            this.monorepo
              .filterProjectsAdv({
                include: "*",
                exclude: [this],
              })
              .tasks.prepare(plugin.of(null))
              .combineLatestArray(),
            last(),
          );
    });
  },
});

export const monorepoBuilder = monorepoBuilderPlugin(
  ["packages/*"],
  plugin.map(({ packages }) => {
    const babelOptions: TransformOptions = {
      babelrc: false,
      sourceMaps: true,
      comments: true,
      rootMode: "upward",
    };

    const packageProjects = packages.map((p) => {
      const name = p.packageJson.name;
      const myPackage = new MyPackage(name, p.path, { babelOptions });
      if (name.startsWith("@hark/")) {
        myPackage.addTag(name.substr("@hark/".length));
      }
      return myPackage;
    });
    const projects = [new MyRootProject(), ...packageProjects];
    const myMonorepo = new MyMonorepo(projects);
    return myMonorepo;
  }),
);

export const runCli = makeCli((args: string[], { reporter }) => {
  //
  // Root Monad
  //
  const topPackage = require("./package.json");
  const rootMonad = plugin.monadRoot(reporter, [], {
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
    static usage = Command.Usage({
      description: `Print help information`,
    });

    @Command.Path(`--help`)
    @Command.Path(`-h`)
    async execute() {
      this.context.stdout.write(this.cli.usage(null));
    }
  }
  cli.register(HelpCommand);

  // Monorepo - CLI
  const {
    commands: {
      CleanCommand,
      // FormatCommand,
      TaskCommand,
      BuildCommand,
      PackageJsonFormatCommand,
      ProjectsListCommand,
      ImportsCheckCommand,
      DevCommand,
    },
  } = makeHarkMonorepoCommands({
    monorepoBuilder,
    rootMonad,
    autoRegisterCommands: false,
  });
  cli.register(CleanCommand);
  // cli.register(FormatCommand);
  cli.register(TaskCommand);
  cli.register(BuildCommand);
  cli.register(PackageJsonFormatCommand);
  cli.register(ProjectsListCommand);
  cli.register(ImportsCheckCommand);
  cli.register(DevCommand);

  class FormatCommand extends HarkMonorepoBaseCommand {
    static usage = Command.Usage({
      description: `Formats code`,
    });

    @Command.Rest()
    projects: string[] = [];

    @Command.Path("format")
    async execute() {
      await rootMonad
        .pipe(
          map((c) => ({ ...c, watchMode: false })),
          monorepoBuilder,
          plugin.switchMake((theMonorepo) =>
            plugin.pipe(
              //
              spawn(["organize-imports-cli", "tsconfig.json"]),
              plugin.of(theMonorepo),
            ),
          ),
          plugin.switchMake((theMonorepo) =>
            theMonorepo
              .filterProjectsByAny(this.projects, "*")
              .tasks.format(plugin.warn("format task not defined."))
              .combineLatestArray(),
          ),
        )
        .toPromise();
      return 0;
    }
  }
  cli.register(FormatCommand);

  class PrepareCommand extends HarkMonorepoBaseCommand {
    @Command.Path("prepare")
    async execute() {
      await rootMonad
        .pipe(
          map((c) => ({ ...c, watchMode: false, release: true })),
          monorepoBuilder,
          plugin.switchMake((theMonorepo) =>
            theMonorepo.getProject("root").task.prepare(plugin.warn("prepare task not defined.")),
          ),
        )
        .toPromise();
      return 0;
    }
  }
  cli.register(PrepareCommand);

  class PublishCommand extends HarkMonorepoBaseCommand {
    static usage = Command.Usage({
      category: "Distribute",
      description: `publish to npm`,
      examples: [
        [
          "Publish a new version to NPM",
          `hark publish [major | minor | patch | premajor | preminor | prepatch | prerelease | x.x.x]`,
        ],
      ],
    });

    @Command.String({ required: true })
    lernaVersionBump: string = "BUMP";

    @Command.Boolean("--skip-prepare")
    skipPrepare: boolean = false;

    @Command.Boolean("--yes")
    yes: boolean = false;

    @Command.Rest()
    lernaVersionArgs: string[] = [];

    @Command.Path("publish")
    async execute() {
      const yesArgs = this.yes ? ["--yes"] : [];
      await rootMonad
        .pipe(
          map((c) => ({ ...c, watchMode: false, release: true })),
          monorepoBuilder,
          plugin.switchMake((theMonorepo) =>
            plugin.pipe(
              spawn.sync(["yarn", "test", "--silent"]),
              last(),
              this.lernaVersionBump === "from-package"
                ? plugin.of(null)
                : spawn.sync(["lerna", "version", this.lernaVersionBump, ...yesArgs, ...this.lernaVersionArgs], {
                    stdio: "inherit",
                  }),
              last(),
              this.skipPrepare ? plugin.log("Skipping prepare") : theMonorepo.getProject("root").task.prepare(),
              spawn.sync(["lerna", "publish", "from-package", "--contents", "dist", ...yesArgs], {
                stdio: "inherit",
              }),
              last(),
            ),
          ),
        )
        .toPromise();
      return 0;
    }
  }
  cli.register(PublishCommand);

  // Run
  return cli.run(args, { ...Cli.defaultContext });
});
