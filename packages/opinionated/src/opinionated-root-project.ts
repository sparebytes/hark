import { plugin } from "@hark/plugin";
import { find } from "@hark/plugin-find";
import { remove } from "@hark/plugin-remove";
import { spawn } from "@hark/plugin-spawn";
import { of } from "rxjs";
import { OpinionatedProjectTaskContext, OpinionatedProjectTasks } from "./models";
import { OpinionatedProject } from "./opinionated-project";

export class OpinionatedRootProject<
  C extends OpinionatedProjectTaskContext,
  TASKS extends OpinionatedProjectTasks
> extends OpinionatedProject<C, TASKS> {
  constructor() {
    super({ name: "root", dependencyFilters$: of(["*"]) });
    this.registerTask("format", () =>
      plugin.pipe(
        //
        this.withDependencies((deps) => deps.tasks.packageJsonFormat(plugin.of(null)).combineLatestArray()),
        spawn(["organize-imports-cli", "tsconfig.json"]),
        spawn(["prettier", "--write", "harkfile.ts", "packages/**/src/**/*.ts"]),
      ),
    );
    this.registerTask("clean", () =>
      plugin.pipe(
        //
        find([".build.cache", "release/packages", "!**/node_modules/**"]),
        remove(),
      ),
    );
  }
}
