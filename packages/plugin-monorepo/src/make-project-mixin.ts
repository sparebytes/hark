import { BaseProjectContext, BaseProjectTasks } from "./models";
import { Project } from "./project";

export interface ProjectMixin<C extends BaseProjectContext, TASKS extends BaseProjectTasks> {
  (clazz: new (...args: any[]) => Project<any, any>): new (...args: any[]) => Project<C, TASKS>;
  use(project: Project<C, TASKS>): void;
}

export const makeProjectMixinFactory = <C extends BaseProjectContext, TASKS extends BaseProjectTasks>() => (
  construct: (this: Project<C, TASKS>, project: Project<C, TASKS>) => void,
) => {
  const use = (project: Project<any, any>) => {
    construct.apply(project as any, [project as any]);
  };
  return Object.assign(
    (clazz: new (...args: any[]) => Project<any, any>): new (...args: any[]) => Project<C, TASKS> => {
      // @ts-ignore
      class ExtendedProject extends clazz {
        constructor(...args: any[]) {
          super(...args);
          use(this);
        }
      }
      return ExtendedProject as new (...args: any[]) => Project<C, TASKS>;
    },
    { use },
  ) as ProjectMixin<C, TASKS>;
};
