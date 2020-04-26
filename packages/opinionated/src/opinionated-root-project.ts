import { plugin } from "@hark/plugin";
import { find } from "@hark/plugin-find";
import { remove } from "@hark/plugin-remove";
import { of } from "rxjs";
import { OpinionatedProjectTaskContext, OpinionatedProjectTasks } from "./models";
import { OpinionatedProject } from "./opinionated-project";

export class OpinionatedRootProject<
  C extends OpinionatedProjectTaskContext,
  TASKS extends OpinionatedProjectTasks
> extends OpinionatedProject<C, TASKS> {
  constructor() {
    super({ name: "root", dependencyFilters$: of(["*"]) });
    this.registerTask("clean", () =>
      plugin.pipe(
        //
        find([".build.cache"]),
        remove(),
      ),
    );
  }
}
