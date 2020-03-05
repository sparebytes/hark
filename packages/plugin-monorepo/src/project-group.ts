import plugin, { HarkPlugin, PluginsSet } from "@hark/plugin";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { BaseProjectContext, BaseProjectTasks, ProjectGroupFilter, ProjectGroupFilters } from "./models";
import { Project } from "./project";

const projectFilterRegex = /^(!?)(\w+)\:(.+)$/;
const projectFilterBeginsWithExclamation = /^!/;

export class ProjectGroup<C extends BaseProjectContext, TASKS extends BaseProjectTasks<C>> {
  readonly projects = new Map<string, Project<C, TASKS>>();
  constructor(projects: Iterable<Project<C, TASKS>>) {
    this.addProjects(Array.from(projects));
  }
  addProject(project: Project<C, TASKS>): this {
    this.projects.set(project.name, project as Project<C, TASKS>);
    return this;
  }
  addProjects(projects: Project<C, TASKS>[]): this {
    for (const project of projects) {
      this.addProject(project);
    }
    return this;
  }
  allProjects(): Project<C, TASKS>[] {
    return [...this.projects.values()];
  }
  hasProject(id: string) {
    return this.projects.has(id);
  }
  getProject(id: string) {
    const project = this.projects.get(id);
    if (project == null) {
      throw new Error(`Unable to find project "${id}"!`);
    }
    return project;
  }
  getProjects(ids: string[]): ProjectGroup<C, TASKS> {
    return new ProjectGroup<C, TASKS>(ids.map((id) => this.getProject(id)));
  }
  normalizeFilter(filter: ProjectGroupFilter): ["include" | "exclude", (project: Project<C, TASKS>) => boolean] {
    if (typeof filter === "function") {
      return ["include", filter];
    } else if (typeof filter === "symbol") {
      return ["include", (project) => project.hasTag(filter)];
    } else if (typeof filter === "string") {
      if (filter === "*" || filter === "any:*" || filter === "name:*") {
        return ["include", () => true];
      }
      const parts = projectFilterRegex.exec(filter);
      if (parts != null) {
        const [, excludeFlag, type, value] = parts;
        if (type === "name") {
          return [excludeFlag ? "exclude" : "include", (project) => project.name === value];
        } else if (type === "path") {
          return [excludeFlag ? "exclude" : "include", (project) => project.path === value];
        } else if (type === "tag") {
          return [excludeFlag ? "exclude" : "include", (project) => project.hasTag(value)];
        } else if (type === "any") {
          return [
            excludeFlag ? "exclude" : "include",
            (project) => project.name === value || project.path === value || project.hasTag(value),
          ];
        }
      }
      throw new Error(`Invalid project filter "${filter}". Should equal "*" or begin with "name:", "path:", "tag:" or "any:"`);
    } else {
      return ["include", (project) => project === filter];
    }
  }
  normalizeFilters(
    filters: ProjectGroupFilters,
  ): {
    include: Array<[(project: Project<C, TASKS>) => boolean, any]>;
    exclude: Array<[(project: Project<C, TASKS>) => boolean, any]>;
  } {
    if (isIterable(filters)) {
      const results: {
        include: Array<[(project: Project<C, TASKS>) => boolean, any]>;
        exclude: Array<[(project: Project<C, TASKS>) => boolean, any]>;
      } = {
        include: [],
        exclude: [],
      };
      for (const filter of filters) {
        const [ei, filterFn] = this.normalizeFilter(filter);
        results[ei].push([filterFn, filter]);
      }
      return results;
    } else {
      const [ei, filterFn] = this.normalizeFilter(filters);
      return { include: [], exclude: [], [ei]: [[filterFn, filters]] };
    }
  }
  filterProjectsByAny(filters: string[], fallbackFilters?: ProjectGroupFilters): ProjectGroup<C, TASKS> {
    return this.filterProjects(
      filters.map((f) => (projectFilterBeginsWithExclamation.test(f) ? `!any:${f}` : `any:${f}`)),
      fallbackFilters,
    );
  }
  filterProjects(
    includeFilters: ProjectGroupFilters,
    fallbackFilters?: ProjectGroupFilters,
    excludeFilters?: ProjectGroupFilters,
  ): ProjectGroup<C, TASKS> {
    let { include, exclude } = this.normalizeFilters(includeFilters);
    if (include.length === 0 && fallbackFilters != null) {
      const tmp = this.normalizeFilters(fallbackFilters);
      include = tmp.include;
      exclude = tmp.exclude;
    }

    if (excludeFilters != null && excludeFilters) {
      const normalExcludes = this.normalizeFilters(excludeFilters);
      if (normalExcludes.exclude.length > 0) {
        throw new Error("filterProjects: items in the array of exclude filters should not being with !");
      }
      exclude = [...exclude, ...normalExcludes.include];
    }
    const allProjects = [...this.projects.values()];
    let projects = new Set<Project<C, TASKS>>();
    for (const i of include) {
      const [filterFn, filterOriginal] = i;
      let oneFound = false;
      let exclusionCount = 0;
      for (const project of allProjects) {
        if (filterFn(project)) {
          let excluded = false;
          for (const [excludeFn, a] of exclude) {
            if (excludeFn(project)) {
              excluded = true;
              exclusionCount++;
              break;
            }
          }
          if (!excluded) {
            oneFound = true;
            projects.add(project);
          }
        }
      }
      if (!oneFound) {
        console.warn(
          `No project found with tag matching "${filterOriginal.toString()}".${
            exclusionCount === 0 ? "" : `${exclusionCount} projects were excluded.`
          }`,
        );
      }
    }
    return new ProjectGroup<C, TASKS>(projects);
  }
  filterProjectsAdv({
    include,
    fallbackFilters,
    exclude,
  }: {
    include: ProjectGroupFilters;
    fallbackFilters?: ProjectGroupFilters;
    exclude?: ProjectGroupFilters;
  }): ProjectGroup<C, TASKS> {
    return this.filterProjects(include, fallbackFilters, exclude);
  }
  getTasksObservable<N extends string, R = TASKS[N], F = TASKS[N]>(
    taskName: N,
    fallback?: Observable<F>,
  ): Observable<[Project<C, TASKS>, R | F]>[] {
    const projectTasks = this.allProjects().map((project) =>
      project.getTaskObservable(taskName, fallback).pipe(map((result) => [project, result] as [Project<C, TASKS>, R | F])),
    );
    return projectTasks;
  }
  getTasks<N extends string, R = TASKS[N], F = TASKS[N]>(
    taskName: N,
    fallbackPlugin?: HarkPlugin<any, F>,
  ): PluginsSet<any, [Project<C, TASKS>, R | F][]> {
    const taskPlugins = this.allProjects().map((project) =>
      plugin.pipe(
        //
        project.getTask(taskName, fallbackPlugin),
        map((result) => [project, result] as [Project<C, TASKS>, R | F]),
      ),
    );
    return new PluginsSet<any, [Project<C, TASKS>, R | F][]>(taskPlugins);
  }
}

function isIterable<T>(obj: unknown | Iterable<T>): obj is Iterable<T> {
  return obj != null && typeof obj === "object" && typeof (obj as any)[Symbol.iterator] === "function";
}
