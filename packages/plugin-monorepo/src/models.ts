import { HarkDataFilesProps, Path, PortablePath } from "@hark/plugin";
import { HarkTaskGroupTasks } from "@hark/task-group";
import { Observable } from "rxjs";
import { Monorepo } from "./monorepo";
import { Project } from "./project";
import { ProjectGroup } from "./project-group";

export type ProjectGroupFilter = string | symbol | Project<any, any> | ((project: Project<any, any>) => boolean);

export type ProjectGroupFilters = ProjectGroupFilter | Iterable<ProjectGroupFilter>;

export interface PackageJsonAndImportComparison {
  name: string;
  imported: boolean;
  dependency: boolean;
  status: string | "not-installed" | "not-imported" | "okay";
}

export interface MonorepoDependency {
  name: string;
  version: string;
  isInMonorepo: boolean;
  isDependency: boolean;
  isDevDependency: boolean;
  isPeerDependency: boolean;
}

export interface BaseProjectContext {
  watchMode: boolean;
}

export interface BaseProjectTasks<C extends BaseProjectContext> extends HarkTaskGroupTasks {
  packageJson: Record<string, any>;
  packageJsonFormat: Record<string, HarkDataFilesProps>;
  monorepoDependencies: Record<string, MonorepoDependency>;
  dependencyFilters: ProjectGroupFilters;
  dependencyProjects: ProjectGroup<C, this>;
  buildRoot: any;
  build: any;
  buildSelf: any;
  buildDependencies: any;
  sourcePaths: PortablePath[];
  readSource: HarkDataFilesProps;
  collectImports: string[];
  compareImportsToPackageJson: PackageJsonAndImportComparison[];
}

export interface BaseProjectOptions {
  name: string;
  path?: Path;
  dependencyFilters$?: Observable<ProjectGroupFilters>;
  sourcePaths$?: Observable<Path[]>;
  tags?: Iterable<string | symbol>;
}
