import { plugin } from "@hark/plugin";
import { BaseProjectContext, BaseProjectTasks, Monorepo } from "@hark/plugin-monorepo";
import { extendCli } from "./extend-cli";
import { HarkMonorepoCommand, HarkMonorepoCommandClass, HarkMonorepoCommandContext } from "./hark-monorepo-command";

export const cliExtendMonorepo = <M extends Monorepo<BaseProjectContext, BaseProjectTasks<BaseProjectContext>>>(
  commandClass: HarkMonorepoCommandClass,
) =>
  extendCli<any, HarkMonorepoCommandContext<M>>(async ({ cli }) => {
    const { Command } = await import("clipanion");
    const { of } = await import("rxjs");
    const { switchMap, tap } = await import("rxjs/operators");

    abstract class BaseCommand extends ((commandClass as any) as typeof HarkMonorepoCommand)<
      Monorepo<BaseProjectContext, BaseProjectTasks<BaseProjectContext>>
    > {}

    class CleanCommand extends BaseCommand {
      @Command.Rest()
      projects: string[] = [];

      @Command.Path("clean")
      async execute() {
        await this.makeMonorepo$({ watchMode: false })
          .pipe(
            plugin.switchMake((theMonorepo) =>
              theMonorepo
                .filterProjectsByAny(this.projects, this.context.allProjectsFilter)
                .tasks[this.context.defaultTasks.clean](plugin.warn("clean task not defined."))
                .concat(),
            ),
          )
          .toPromise();
        return 0;
      }
    }

    class FormatCommand extends BaseCommand {
      @Command.Rest()
      projects: string[] = [];

      @Command.Path("format")
      async execute() {
        await this.makeMonorepo$({ watchMode: false })
          .pipe(
            plugin.switchMake((theMonorepo) =>
              theMonorepo
                .filterProjectsByAny(this.projects, this.context.allProjectsFilter)
                .tasks[this.context.defaultTasks.format](plugin.warn("format task not defined."))
                .combineLatestArray(),
            ),
          )
          .toPromise();
        return 0;
      }
    }

    class TaskCommand extends BaseCommand {
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
        await this.makeMonorepo$({ watchMode: this.watchMode })
          .pipe(
            plugin.switchMake((theMonorepo) =>
              theMonorepo
                .filterProjectsByAny(this.projects, this.context.rootProjectFilter)
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

    class BuildCommand extends BaseCommand {
      @Command.Boolean("-w,--watch")
      watchMode: boolean = false;

      @Command.Rest()
      projects: string[] = [];

      @Command.Path("build")
      async execute() {
        await this.makeMonorepo$({ watchMode: this.watchMode })
          .pipe(
            plugin.switchMake((theMonorepo) =>
              theMonorepo
                .filterProjectsByAny(this.projects, this.context.rootProjectFilter)
                .tasks[this.context.defaultTasks.buildRoot]()
                .combineLatestArray(),
            ),
          )
          .toPromise();
        return 0;
      }
    }

    class PackageJsonFormatCommand extends BaseCommand {
      @Command.Rest()
      projects: string[] = [];

      @Command.Path("packageJson", "format")
      async execute() {
        await this.makeMonorepo$({ watchMode: false })
          .pipe(
            plugin.switchMake((theMonorepo) =>
              theMonorepo
                .filterProjectsByAny(this.projects, this.context.allProjectsFilter)
                .tasks[this.context.defaultTasks.packageJsonFormat](plugin.of(null))
                .combineLatestArray(),
            ),
          )
          .toPromise();
        return 0;
      }
    }

    class ImportsCheckCommand extends BaseCommand {
      @Command.Boolean("--json")
      jsonOutput = false;

      @Command.Array("-f,--filter")
      filters: Array<string | "okay" | "not-installed" | "not-imported"> = [];

      @Command.Rest()
      projects: string[] = [];

      static usage = Command.Usage({
        description: `Checks for import and package.json discrepancies.`,
        details: `[-f,--filter] "okay" | "not-installed" | "not-imported"`,
      });

      @Command.Path("imports", "check")
      async execute() {
        const { default: chalk } = await import("chalk");
        await this.makeMonorepo$({ watchMode: false })
          .pipe(
            plugin.switchMake((theMonorepo) =>
              theMonorepo
                .filterProjectsByAny(this.projects, this.context.allProjectsFilter)
                .tasks[this.context.defaultTasks.compareImportsToPackageJson]()
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

    class DevCommand extends BaseCommand {
      @Command.Rest()
      projects: string[] = [];

      @Command.Path("dev")
      async execute() {
        await this.makeMonorepo$({ watchMode: true })
          .pipe(
            plugin.switchMake((theMonorepo) =>
              theMonorepo
                .filterProjectsByAny(this.projects, this.context.rootProjectFilter)
                .tasks[this.context.defaultTasks.dev](plugin.of(null))
                .combineLatestArray(),
            ),
          )
          .toPromise();
        return 0;
      }
    }

    cli.register(CleanCommand);
    cli.register(FormatCommand);
    cli.register(TaskCommand);
    cli.register(BuildCommand);
    cli.register(PackageJsonFormatCommand);
    cli.register(ImportsCheckCommand);
    cli.register(DevCommand);

    const result: HarkMonorepoCommandContext<M> = {
      monorepo: plugin.throwError("Monorepo not given."),
      rootProjectFilter: "name:root",
      allProjectsFilter: "*",
      defaultTasks: {
        clean: "clean",
        format: "format",
        buildRoot: "buildRoot",
        compareImportsToPackageJson: "compareImportsToPackageJson",
        packageJsonFormat: "packageJsonFormat",
        dev: "dev",
      },
    };
    return result;
  });
