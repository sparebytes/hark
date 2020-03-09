import { HarkPlugin, npath, plugin, PortablePath } from "@hark/plugin";
import { find } from "@hark/plugin-find";
import { findOrWatch } from "@hark/plugin-find-or-watch";
import { overwrite } from "@hark/plugin-overwrite";
import { packageJsonFormat } from "@hark/plugin-package-json-format";
import { packageJsonLoad } from "@hark/plugin-package-json-load";
import { read } from "@hark/plugin-read";
import { HarkTaskGroup } from "@hark/task-group";
import builtinModulesArray from "builtin-modules";
import { map } from "rxjs/operators";
import {
  BaseProjectContext,
  BaseProjectOptions,
  BaseProjectTasks,
  MonorepoDependency,
  PackageJsonAndImportComparison,
} from "./models";
import { ProjectGroup } from "./project-group";
import { Monorepo } from "./monorepo";

const builtinModules = new Set(builtinModulesArray);
export class Project<C extends BaseProjectContext, TASKS extends BaseProjectTasks<C>> extends HarkTaskGroup<C, TASKS> {
  protected _monorepo?: Monorepo<C, TASKS>;
  get monorepo(): Monorepo<C, TASKS> {
    const v = this._monorepo;
    if (v == null) {
      throw new Error("monorepo hasn't been set yet!");
    }
    return v;
  }
  set monorepo(v: Monorepo<C, TASKS>) {
    if (this._monorepo != null) {
      throw new Error("monorepo has already been set!");
    }
    this._monorepo = v;
  }
  readonly path?: PortablePath;
  readonly tags: Set<string | symbol>;
  constructor({ name, path, dependencyFilters$, sourcePaths$, tags }: BaseProjectOptions) {
    super(name);
    this.path = path == null ? undefined : npath.toPortablePath(path);

    this.tags = new Set(tags);
    this.tags.add(name);

    // build
    this.registerTask("build", () => this.getTask("buildDepenencies"));

    // buildDependencies
    this.registerTask("buildDependencies", () => this.withDependencies((deps) => deps.tasks.build().combineLatestArray()));

    // sourcePaths
    if (sourcePaths$ != null) {
      this.registerTask("sourcePaths", () =>
        plugin.from(sourcePaths$.pipe(map((paths) => paths.map((p) => npath.fromPortablePath(p))))),
      );
    }

    // packageJson
    if (this.path) {
      this.registerTask("packageJson", (gc) => packageJsonLoad({ path: `${this.path}/package.json`, watchMode: gc.watchMode }));
    }

    // packageJsonFormat
    if (this.path) {
      this.registerTask("packageJsonFormat", (gc) =>
        plugin.pipe(
          //
          find(`${this.path}/package.json`),
          read(),
          packageJsonFormat(),
          overwrite(),
        ),
      );
    }

    // monorepoDependencies
    this.registerTask("monorepoDependencies", (gc) =>
      plugin.pipe(
        this.getTask("packageJson", plugin.of({})),
        plugin.map((json: any) => {
          const dependencies = json?.dependencies ?? {};
          const peerDependencies = json?.peerDependencies ?? {};
          const devDependencies = json?.devDependencies ?? {};
          const allDependencies: Record<string, MonorepoDependency> = Object.fromEntries(
            Array.from(new Set([...Object.keys(dependencies), ...Object.keys(peerDependencies), ...Object.keys(devDependencies)]))
              .sort((a, b) => (a > b ? 1 : -1))
              .map((depName) => [
                depName,
                {
                  name: depName,
                  version: dependencies[depName] ?? peerDependencies[depName] ?? devDependencies[depName] ?? "*",
                  isInMonorepo: this.monorepo.hasProject(depName),
                  isDependency: dependencies[depName] != null,
                  isDevDependency: devDependencies[depName] != null,
                  isPeerDependency: peerDependencies[depName] != null,
                },
              ]),
          );
          return allDependencies;
        }),
      ),
    );

    // dependencyFilters
    if (dependencyFilters$ != null) {
      this.registerTask("dependencyFilters", () => plugin.from(dependencyFilters$));
    } else {
      this.registerTask("dependencyFilters", () =>
        plugin.pipe(
          this.getTask("monorepoDependencies"),
          plugin.map((allDependencies) =>
            Object.values(allDependencies)
              .filter((d) => d.isInMonorepo)
              .map((d) => `name:${d.name}`),
          ),
        ),
      );
    }

    // dependencyProjects
    this.registerTask("dependencyProjects", (gc) =>
      plugin.pipe(
        this.getTask("dependencyFilters"),
        plugin.map((dependencyFilters) =>
          this.monorepo.filterProjectsAdv({
            include: dependencyFilters,
            exclude: (project) => project === this,
          }),
        ),
      ),
    );

    // compareImportsToPackageJson
    this.registerTask("compareImportsToPackageJson", () =>
      plugin.pipe(
        plugin.combineLatest(
          //
          this.getTask("collectImports"),
          this.getTask("monorepoDependencies"),
        ),
        plugin.map(([imports, monorepoDependencies]) => {
          // TODO, this this account for imports from other package json files that are declared as peer dependencies in their respective packages.
          const comparisons = new Map<string, PackageJsonAndImportComparison>(
            imports
              .filter((importString) => !builtinModules.has(importString))
              .map((importString) => [
                importString,
                { name: importString, imported: true, dependency: false, peerDependency: false, status: "not-installed" },
              ]),
          );
          for (const dependency of Object.values(monorepoDependencies)) {
            if (!dependency.isDependency && !dependency.isPeerDependency) continue;
            let comparison = comparisons.get(dependency.name);
            if (comparison != null) {
              comparison.dependency = true;
              comparison.status = "okay";
            } else {
              comparisons.set(dependency.name, {
                name: dependency.name,
                imported: false,
                dependency: true,
                status: "not-imported",
              });
            }
          }
          const results = [...comparisons.values()];
          return results;
        }),
      ),
    );

    // readSource
    this.registerTask("readSource", (gc) =>
      plugin.pipe(
        //
        this.getTask(
          "sourcePaths",
          plugin.pipe(
            plugin.of([]),
            plugin.warn(`Warning: "sourcePaths" task is not implemented for project ${this.name}. Returning none.`),
          ),
        ),
        plugin.switchMake((sourcePaths) => findOrWatch(gc.watchMode, sourcePaths)),
        read(),
      ),
    );

    // collectImports
    this.registerTask("collectImports", () =>
      plugin.pipe(
        //
        this.getTask("readSource"),
        plugin.map(({ files }) => {
          const imports = new Set<string>();
          const filterRegex = /\.([jt]sx?|[cm]js)$/;
          const importsRegex1 = /\bfrom\s*["']((?:@[a-z0-9\-_][a-z0-9\-_.]*\/)?[a-z0-9\-_][a-z0-9\-_.]*)(?:\/[a-z0-9\-_./]*)?['"]/g;
          const importsRegex2 = /\bimport\s*\(\s*["']((?:@[a-z0-9\-_][a-z0-9\-_.]*\/)?[a-z0-9\-_][a-z0-9\-_.]*)(?:\/[a-z0-9\-_./]*)?['"]\s*\)/g;
          const requiresRegex = /\brequire\s*\(\s*["']((?:@[a-z0-9\-_][a-z0-9\-_.]*\/)?[a-z0-9\-_][a-z0-9\-_.]*)(?:\/[a-z0-9\-_./]*)?['"]\s*\)/g;
          for (const file of files) {
            if (filterRegex.test(file.path)) {
              for (const importString of file.data.matchAll(importsRegex1)) {
                imports.add(importString[1]);
              }
              for (const importString of file.data.matchAll(importsRegex2)) {
                imports.add(importString[1]);
              }
              for (const importString of file.data.matchAll(requiresRegex)) {
                imports.add(importString[1]);
              }
            }
          }
          return Array.from(imports).sort((a, b) => (a > b ? 1 : -1));
        }),
      ),
    );
  }

  hasTag(tag: string | symbol): boolean {
    return this.tags.has(tag);
  }

  addTag(...tags: (string | symbol)[]): this {
    return this.addTags(tags);
  }

  addTags(tags: Iterable<string | symbol>): this {
    for (const tag of tags) {
      this.tags.add(tag);
    }
    return this;
  }

  withDependencies<I, O>(callback: (projectGroup: ProjectGroup<C, TASKS>) => HarkPlugin<I, O>): HarkPlugin<I, O> {
    return plugin.switchMake((m, c, m$) =>
      plugin.pipe(
        this.getTask("dependencyProjects"),
        plugin.switchMap((projectGroup) => callback((projectGroup as any) as ProjectGroup<C, TASKS>)(m$)),
      ),
    );
  }
}
