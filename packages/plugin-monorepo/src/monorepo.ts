import { HarkMonad } from "@hark/plugin";
import { map } from "rxjs/operators";
import { BaseProjectContext, BaseProjectTasks } from "./models";
import { Project } from "./project";
import { ProjectGroup } from "./project-group";

export class Monorepo<C extends BaseProjectContext, TASKS extends BaseProjectTasks> extends ProjectGroup<C, TASKS> {
  readonly _C!: C;
  private taskGroupContext$?: HarkMonad<BaseProjectContext> = undefined;
  constructor(projects: Iterable<Project<C, TASKS>> = []) {
    super(projects);
  }
  addProject(project: Project<C, TASKS>): void {
    project.monorepo = this;
    if (this.taskGroupContext$ != null) {
      project.setTaskContext(this.taskGroupContext$ as any);
    }
    super.addProject(project);
  }
  setTaskContext(taskContextMonad: HarkMonad<C>): void {
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
  }
  ready(): void {
    for (const project of this.projects.values()) {
      project.ready();
    }
  }
}
