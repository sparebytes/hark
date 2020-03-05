import { HarkMonad } from "@hark/plugin";
import { map } from "rxjs/operators";
import { BaseProjectContext, BaseProjectTasks } from "./models";
import { Project } from "./project";
import { ProjectGroup } from "./project-group";

export class Monorepo<C extends BaseProjectContext, TASKS extends BaseProjectTasks<C>> extends ProjectGroup<C, TASKS> {
  readonly _C!: C;
  private taskGroupContext$?: HarkMonad<BaseProjectContext> = undefined;
  constructor(projects: Iterable<Project<C, TASKS>> = []) {
    super(projects);
  }
  addProject(project: Project<C, TASKS>): this {
    if (this.taskGroupContext$ != null) {
      project.setTaskContext(this.taskGroupContext$ as any);
    }
    return super.addProject(project);
  }
  setTaskContext(taskContextMonad: HarkMonad<C>): this {
    this.taskGroupContext$ = taskContextMonad.pipe(
      map((context) => ({
        watchMode: false,
        ...context,
        monorepo: this,
      })),
    );
    for (const project of this.projects.values()) {
      project.setTaskContext(this.taskGroupContext$ as any);
    }
    return this;
  }
  ready(): this {
    for (const project of this.projects.values()) {
      project.ready();
    }
    return this;
  }
}
