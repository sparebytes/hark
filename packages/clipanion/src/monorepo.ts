import { HarkMonad, HarkPlugin, plugin } from "@hark/plugin";
import { BaseProjectContext, BaseProjectTasks, Monorepo } from "@hark/plugin-monorepo";
import { BaseContext, Cli, Command, CommandClass } from "clipanion";
import { map, tap } from "rxjs/operators";

export abstract class HarkBaseCommand<Context extends BaseContext = BaseContext> extends Command<Context> {}

export abstract class HarkMonorepoBaseCommand<CommandContext extends BaseContext = BaseContext> extends HarkBaseCommand<
  CommandContext
> {}

export interface MakeHarkMonorepoCommandsOptions<I, C extends BaseProjectContext, T extends BaseProjectTasks> {
  rootMonad: HarkMonad<I>;
  monorepoBuilder: HarkPlugin<I, Monorepo<C, T>>;
  taskNames?: Record<string, string>;
  rootProjectFilter?: string;
  allProjectsFilter?: string;
  autoRegisterCommands?: boolean;
  cli?: Cli;
}

export function makeHarkMonorepoCommands<I, C extends BaseProjectContext, T extends BaseProjectTasks>({
  rootMonad,
  monorepoBuilder,
  taskNames,
  rootProjectFilter,
  allProjectsFilter,
  autoRegisterCommands,
  cli,
}: MakeHarkMonorepoCommandsOptions<I, C, T>) {
  function getTaskName<N extends string>(name: N): N {
    return (taskNames?.[name] as N) || (name as N);
  }

  allProjectsFilter = allProjectsFilter || "*";
  rootProjectFilter = rootProjectFilter || "name:root";
  autoRegisterCommands = autoRegisterCommands ?? true;

  class CleanCommand extends HarkMonorepoBaseCommand {
    static usage = Command.Usage({
      description: `Cleans projects by deleting build artifacts`,
    });

    @Command.Rest()
    projects: string[] = [];

    @Command.Path("clean")
    async execute() {
      await rootMonad
        .pipe(
          map((c) => ({ ...c, watchMode: false })),
          monorepoBuilder,
          plugin.switchMake((theMonorepo) =>
            theMonorepo
              .filterProjectsByAny(this.projects, allProjectsFilter)
              .tasks[getTaskName("clean")](plugin.warn("clean task not defined."))
              .concat(),
          ),
        )
        .toPromise();
      return 0;
    }
  }

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
            theMonorepo
              .filterProjectsByAny(this.projects, allProjectsFilter)
              .tasks[getTaskName("format")](plugin.warn("format task not defined."))
              .combineLatestArray(),
          ),
        )
        .toPromise();
      return 0;
    }
  }

  class TaskCommand extends HarkMonorepoBaseCommand {
    static usage = Command.Usage({
      description: `Runs an arbitrary task on projects`,
    });

    @Command.Boolean("-w,--watch")
    watchMode: boolean = false;

    @Command.Boolean("-q,--quiet")
    quiet: boolean = false;

    @Command.Boolean("--json")
    printJson: boolean = false;

    @Command.String({ required: true })
    task: string = "";

    @Command.Rest()
    projects: string[] = [];

    @Command.Path("task")
    async execute() {
      if (!this.task) {
        throw new Error("A task must be given.");
      }
      const { default: chalk } = await import("chalk");
      await rootMonad
        .pipe(
          map((c) => ({ ...c, watchMode: this.watchMode })),
          monorepoBuilder,
          plugin.switchMake((theMonorepo) =>
            theMonorepo
              .filterProjectsByAny(this.projects, rootProjectFilter)
              .tasks[this.task](plugin.of(undefined))
              .combineLatestArray(),
          ),
          tap((results) => {
            if (this.quiet) return;
            if (this.printJson) {
              const data = results.map(([project, projectResults]) => [project.name, projectResults]);
              console["log"](JSON.stringify(data));
            } else {
              for (const [project, result] of results) {
                console["log"](" ");
                console["log"](chalk.blueBright(project.name), result);
                console["log"](" ");
              }
            }
          }),
        )
        .toPromise();
      return 0;
    }
  }

  class BuildCommand extends HarkMonorepoBaseCommand {
    static usage = Command.Usage({
      description: `Builds projects`,
      details: `[-f,--filter] "okay" | "not-installed" | "not-imported"`,
    });

    @Command.Boolean("-w,--watch")
    watchMode: boolean = false;

    @Command.Rest()
    projects: string[] = [];

    @Command.Path("build")
    async execute() {
      await rootMonad
        .pipe(
          map((c) => ({ ...c, watchMode: this.watchMode })),
          monorepoBuilder,
          plugin.switchMake((theMonorepo) =>
            theMonorepo
              .filterProjectsByAny(this.projects, rootProjectFilter)
              .tasks[getTaskName("buildRoot")]()
              .combineLatestArray(),
          ),
        )
        .toPromise();
      return 0;
    }
  }

  class PackageJsonFormatCommand extends HarkMonorepoBaseCommand {
    static usage = Command.Usage({
      description: `Formats all package.json files`,
    });

    @Command.Rest()
    projects: string[] = [];

    @Command.Path("packageJson", "format")
    async execute() {
      await rootMonad
        .pipe(
          map((c) => ({ ...c, watchMode: false })),
          monorepoBuilder,
          plugin.switchMake((theMonorepo) =>
            theMonorepo
              .filterProjectsByAny(this.projects, allProjectsFilter)
              .tasks[getTaskName("packageJsonFormat")](plugin.of(null))
              .combineLatestArray(),
          ),
        )
        .toPromise();
      return 0;
    }
  }

  class ProjectsListCommand extends HarkMonorepoBaseCommand {
    static usage = Command.Usage({
      description: `List all detected packages`,
    });

    @Command.Rest()
    projects: string[] = [];

    @Command.Path("projects", "list")
    async execute() {
      const { default: chalk } = await import("chalk");
      await rootMonad
        .pipe(
          map((c) => ({ ...c, watchMode: false })),
          monorepoBuilder,
          tap((theMonorepo) => {
            const projects = theMonorepo.filterProjectsByAny(this.projects, allProjectsFilter).allProjects();
            for (const project of projects) {
              console["log"](chalk.blue(project.name), chalk.gray(project.path || ""));
            }
          }),
        )
        .toPromise();
      return 0;
    }
  }

  class ImportsCheckCommand extends HarkMonorepoBaseCommand {
    static usage = Command.Usage({
      description: `*Experimental* Checks for between package.json dependencies and imports from source code`,
      details: `
          [-f,--filter] "okay" | "not-installed" | "not-imported"
      `,
    });

    @Command.Boolean("--json")
    jsonOutput = false;

    @Command.Array("-f,--filter")
    filters: Array<string | "okay" | "not-installed" | "not-imported"> = [];

    @Command.Rest()
    projects: string[] = [];

    @Command.Path("imports", "check")
    async execute() {
      const { default: chalk } = await import("chalk");
      await rootMonad
        .pipe(
          map((c) => ({ ...c, watchMode: false })),
          monorepoBuilder,
          plugin.switchMake((theMonorepo) =>
            theMonorepo
              .filterProjectsByAny(this.projects, allProjectsFilter)
              .tasks[getTaskName("compareImportsToPackageJson")]()
              .combineLatestArray(),
          ),
          tap((results) => {
            if (this.filters.length > 0) {
              results = results.map(([project, imports]) => [project, imports.filter((i) => this.filters.includes(i.status))]);
            }

            if (this.jsonOutput) {
              const object = Object.fromEntries(results.map(([project, imports]) => [project.name, imports]));
              console["log"](JSON.stringify(object));
            } else {
              for (const result of results) {
                const [project, comparisons] = result as [any, any];
                const hasMismatch = comparisons.some((c: any) => c.imported !== c.dependency);
                console["log"]("");
                console["log"]((hasMismatch ? chalk.yellow : chalk.gray)(project.name));
                for (const { name, imported, dependency } of comparisons as any[]) {
                  if (imported === dependency) {
                    if (!imported) {
                      console["log"](" ", chalk.magenta(name), "Where did this come from?");
                    } else {
                      console["log"](" ", chalk.green(name));
                    }
                  } else if (imported) {
                    console["log"](" ", chalk.red(name), "Imported but not declared as a dependency.");
                  } else {
                    console["log"](" ", chalk.yellow(name), "Declared as a dependency but not imported.");
                  }
                }
              }
            }
          }),
        )
        .toPromise();
      return 0;
    }
  }

  class DevCommand extends HarkMonorepoBaseCommand {
    static usage = Command.Usage({
      description: `Runs projects in development mode`,
    });

    @Command.Rest()
    projects: string[] = [];

    @Command.Path("dev")
    async execute() {
      await rootMonad
        .pipe(
          map((c) => ({ ...c, watchMode: true })),
          monorepoBuilder,
          plugin.switchMake((theMonorepo) =>
            theMonorepo
              .filterProjectsByAny(this.projects, rootProjectFilter)
              .tasks[getTaskName("dev")](plugin.of(null))
              .combineLatestArray(),
          ),
        )
        .toPromise();
      return 0;
    }
  }

  const commands = {
    CleanCommand,
    FormatCommand,
    TaskCommand,
    BuildCommand,
    PackageJsonFormatCommand,
    ProjectsListCommand,
    ImportsCheckCommand,
    DevCommand,
  };

  if (autoRegisterCommands) {
    if (!cli) {
      throw new Error(`"autoRegisterCommands" should be set to false or "cli" option should be provided.`);
    }
    Object.values(commands).forEach((C) => cli.register(C));
  }

  return { commands: (commands as unknown) as { [K in keyof typeof commands]: CommandClass<any> } };
}
