import { makeProjectMixinFactory } from "@hark/plugin-monorepo";
import { OpinionatedProjectTaskContext, OpinionatedProjectTasks } from "./models";
import { OpinionatedMonorepo } from "./opinionated-monorepo";
import { OpinionatedPackage } from "./opinionated-package";
import { OpinionatedProject } from "./opinionated-project";
import { OpinionatedRootProject } from "./opinionated-root-project";

export interface OpinionatedFactoryOptions<C extends OpinionatedProjectTaskContext, TASKS extends OpinionatedProjectTasks> {
  project?(this: OpinionatedProject<C, TASKS>, p: OpinionatedProject<C, TASKS>): void;
  package?(this: OpinionatedPackage<C, TASKS>, p: OpinionatedProject<C, TASKS>): void;
  rootProject?(this: OpinionatedRootProject<C, TASKS>, p: OpinionatedProject<C, TASKS>): void;
}

export const opinionatedFactory = <C extends OpinionatedProjectTaskContext, TASKS extends OpinionatedProjectTasks>({
  project: projectMixinFn,
  package: packageMixinFn,
  rootProject: rootProjectMixinFn,
}: OpinionatedFactoryOptions<C, TASKS> = {}) => {
  const mixinFactory = makeProjectMixinFactory<C, TASKS>();

  const projectMixin = mixinFactory((proj) => {
    projectMixinFn?.apply(proj as any, [proj as any]);
  });
  const packageMixin = mixinFactory((proj) => {
    projectMixin.use(proj);
    packageMixinFn?.apply(proj as any, [proj as any]);
  });
  const rootProjectMixin = mixinFactory((proj) => {
    projectMixin.use(proj);
    rootProjectMixinFn?.apply(proj as any, [proj as any]);
  });

  const _Project = projectMixin(OpinionatedProject);
  const _Package = packageMixin(OpinionatedPackage);
  const _RootProject = rootProjectMixin(OpinionatedRootProject);

  return {
    MyProject: _Project,
    MyPackage: _Package,
    MyRootProject: _RootProject,
    MyMonorepo: OpinionatedMonorepo,
    projectMixin,
    packageMixin,
    rootProjectMixin,
    mixinFactory,
  };
};
