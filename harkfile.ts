import { cliExtendMonorepo, extendCli, HarkMonorepoCommand, HarkMonorepoCommandContext } from "@hark/cli";
import { HarkCompilationEvent, HarkJsonFilesProps, npath, plugin, PortablePath } from "@hark/plugin";
import { copy } from "@hark/plugin-copy";
import { find } from "@hark/plugin-find";
import { findOrWatch } from "@hark/plugin-find-or-watch";
import { jsonParse } from "@hark/plugin-json-parse";
import { babel } from "@hark/plugin-lib-babel";
import { BaseProjectContext, BaseProjectOptions, BaseProjectTasks, Monorepo, monorepo, Project } from "@hark/plugin-monorepo";
import { packageJsonClean } from "@hark/plugin-package-json-clean";
import { packageJsonFormat } from "@hark/plugin-package-json-format";
import { read } from "@hark/plugin-read";
import { remove } from "@hark/plugin-remove";
import { rename } from "@hark/plugin-rename";
import { spawn } from "@hark/plugin-spawn";
import { spawnTsc } from "@hark/plugin-spawn-tsc";
import { generateTsconfigFile, TsconfigData } from "@hark/plugin-tsconfig";
import { write } from "@hark/plugin-write";
import { Command } from "clipanion";
import { of } from "rxjs";
import { debounceTime, last, map, scan } from "rxjs/operators";

export const myMonorepoPlugin = monorepo(
  ["packages/*"],
  plugin.map(({ packages }) => {
    const myMonorepo = new MyMonorepo(
      packages.map((p) => {
        const name = p.packageJson.name;
        const myPackage = new MyPackage(name, p.path);
        if (name.startsWith("@hark/")) {
          myPackage.addTag(name.substr("@hark/".length));
        }
        return myPackage;
      }),
    ).addProject(
      new MyProject({ name: "root", dependencyFilters$: of(["*"]) })
        .registerTask("prepare", function(gc) {
          return gc.watchMode
            ? plugin.throwError("Cannot prepare in watch mode!")
            : plugin.pipe(
                //
                gc.monorepo.getTasks("clean", plugin.of(null)).combineLatestArray(),
                last(),
                this.getTask("buildRoot"),
                last(),
                gc.monorepo
                  .filterProjectsAdv({
                    include: "*",
                    exclude: [this],
                  })
                  .getTasks("prepare", plugin.of(null))
                  .combineLatestArray(),
                last(),
              );
        })
        .registerTask("format", function() {
          return plugin.pipe(
            //
            this.withDependencies((deps) => deps.getTasks("packageJsonFormat", plugin.of(null)).combineLatestArray()),
            spawn(["organize-imports-cli", "tsconfig.json"]),
            spawn(["prettier", "--write", "src/**/*.ts", "packages/**/src/**/*.ts"]),
          );
        })
        .registerTask("clean", () =>
          plugin.pipe(
            //
            find([".build.cache", "release/packages", "!**/node_modules/**"]),
            remove(),
          ),
        ),
    );

    return myMonorepo;
  }),
);

export abstract class BaseCommand extends HarkMonorepoCommand<
  MyMonorepo,
  "version" | "devDebounceTime" | "gitRepositoryUrl" | "release"
> {
  async monadDefaults() {
    const topPackage = require("./package.json");
    return {
      version: topPackage.version as string,
      gitRepositoryUrl: topPackage?.repository?.url,
      devDebounceTime: 100,
      release: false,
    };
  }
}

export default extendCli<HarkMonorepoCommandContext<MyMonorepo>, HarkMonorepoCommandContext<MyMonorepo>>(
  async ({ cli, cliRegister }) => {
    @cliRegister
    class PrepareCommand extends BaseCommand {
      @Command.Path("prepare")
      async execute() {
        await this.makeMonorepo$({ watchMode: false, release: true })
          .pipe(
            plugin.switchMake((theMonorepo) =>
              theMonorepo.getProject("root").getTask("prepare", plugin.warn("prepare task not defined.")),
            ),
          )
          .toPromise();
        return 0;
      }
    }

    @cliRegister
    class PublishCommand extends BaseCommand {
      @Command.String({ required: true })
      lernaVersionBump: string = "BUMP";

      @Command.Rest()
      lernaVersionArgs: string[] = [];

      @Command.Path("publish")
      async execute() {
        await this.makeMonorepo$({ watchMode: false, release: true })
          .pipe(
            plugin.switchMake((theMonorepo) =>
              plugin.pipe(
                spawn(["yarn", "test", "--silent"]),
                last(),
                this.lernaVersionBump === "from-package"
                  ? plugin.of(null)
                  : spawn(["lerna", "version", this.lernaVersionBump, "--yes", ...this.lernaVersionArgs]),
                last(),
                theMonorepo.getProject("root").getTask("prepare"),
                spawn(["lerna", "publish", "from-package", "--contents", "dist", "--yes"]),
                last(),
              ),
            ),
          )
          .toPromise();
        return 0;
      }
    }

    return {
      ...(await cliExtendMonorepo(BaseCommand)({ cli, cliRegister })),
      monorepo: myMonorepoPlugin,
    };
  },
);

export interface MyProjectTaskContext extends BaseProjectContext {
  version: string;
  devDebounceTime: number;
  gitRepositoryUrl?: string;
  release: boolean;
}

export interface MyProjectTasks extends BaseProjectTasks<MyProjectTaskContext> {
  typescriptCompile: any;
  tsconfigGen: HarkJsonFilesProps<TsconfigData>;
  tsconfigData: TsconfigData;
  babelTranspile: any;
  babelTranspileDependencies: any;
  babelTranspileSelf: any;
}

export class MyProject extends Project<MyProjectTaskContext, MyProjectTasks> {
  constructor(options: BaseProjectOptions) {
    super(options);

    // buildRoot
    this.registerTask("buildRoot", (gc) =>
      plugin.pipe(
        plugin.log("Starting Build Root"),
        plugin.combineLatestArray([
          //
          this.getTask("build"),
          this.getTask("typescriptCompile"),
        ]),
        debounceTime(gc.devDebounceTime),
        plugin.log("Done Build Root"),
      ),
    );

    // build
    this.registerTask("build", () =>
      plugin.ifEmpty(
        plugin.combineLatestArray([
          this.getTask("buildDependencies", plugin.warn(`"buildDependencies" task not implemented. Doing Nothing.`)),
          this.getTask("babelTranspileSelf", plugin.warn(`"babelTranspileSelf" task is not implemented. Doing nothing.`)),
        ]),
        plugin.warn("Nothing to do apparently"),
      ),
    );

    // typescriptCompile
    this.registerTask("typescriptCompile", (gc) =>
      plugin.pipe(
        this.getTask("tsconfigGen"),
        plugin.switchMake(({ files }) => {
          if (files.length === 0) {
            return plugin.pipe(
              //
              plugin.warn("No tsconfig files to build."),
              plugin.of({
                successes: 1,
                failures: 0,
                isSuccess: true,
                isFinalCompilation: true,
              }),
            );
          }
          return spawnTsc({ watch: gc.watchMode, build: files.map((f) => f.path) });
        }),
      ),
    );

    // tsconfigGen
    this.registerTask("tsconfigGen", () =>
      plugin.pipe(
        plugin.combineLatest(
          //
          this.getTask("tsconfigData", plugin.of(null)),
          this.withDependencies((deps) => deps.getTasks("tsconfigGen").combineLatestArray()),
        ),
        map(([tsconfigData, depProjectTsconfigs]) => {
          if (tsconfigData == null && depProjectTsconfigs.length === 0) {
            return { files: [] };
          }
          const referencePaths = depProjectTsconfigs.flatMap((d) => d[1].files.map((f) => f.path));
          return {
            files: [
              generateTsconfigFile({
                relDir: this.path,
                fileDir: `.build.cache/tsconfig` as PortablePath,
                filenamePrefix: `tsconfig_${this.name.replace(/[\\\/]/g, "-")}_`,
                filenameSuffix: ".json",
                filenameHash: true,
                referencePaths,
                data: tsconfigData ?? { files: [] },
              }),
            ],
          } as HarkJsonFilesProps<TsconfigData>;
        }),
        write("."),
      ),
    );
  }
}

export class MyPackage extends MyProject {
  declare path: PortablePath;
  constructor(name: string, path: string) {
    super({ name, path, sourcePaths$: of([`${path}/src/**/*.ts`, `!**/*.test.ts`]) });

    // clean
    this.registerTask("clean", () =>
      plugin.pipe(
        //
        find([`${this.path}/**/dist`, `${this.path}/**/*.tsbuildinfo`, `!**/node_modules/**`]),
        remove(),
      ),
    );

    // babelTranspileSelf
    this.registerTask("babelTranspileSelf", (gc) =>
      transpile({ watchMode: gc.watchMode, srcDir: `${path}/src`, outDir: `${path}/dist`, comments: true }),
    );

    // tsconfigData
    this.registerTask("tsconfigData", () =>
      plugin.of({
        extends: "../../tsconfig.base.json",
        compilerOptions: {
          baseUrl: ".",
          rootDir: "src",
          outDir: "dist",
          isolatedModules: true,
          skipLibCheck: true,
          sourceMap: false,
          declaration: true,
          emitDeclarationOnly: true,
          composite: true,
        },
        include: ["src"],
        exclude: ["**/*.test.tsx?"],
      }),
    );

    // prepare
    this.registerTask("prepare", (gc) =>
      gc.watchMode
        ? plugin.throwError("Cannot prepare in watch mode!")
        : plugin.pipe(
            //
            copyPackageJson({
              gitRepositoryUrl: gc.gitRepositoryUrl,
              path: `${this.path}/package.json`,
              writeDir: `${this.path}/dist`,
              watchMode: false,
            }),
            last(),
            find([`${this.path}/bin/**/*`], { onlyFiles: true }),
            copy(`${this.path}/dist/bin`),
            find([`${this.path}/dist/**/*`], { onlyFiles: true }),
            copy("release/packages"),
          ),
    );
  }
}

export class MyMonorepo extends Monorepo<MyProjectTaskContext, MyProjectTasks> {}

export const transpile = ({
  srcDir,
  outDir,
  watchMode,
  comments,
}: {
  watchMode: boolean;
  srcDir: string;
  outDir: string;
  comments?: boolean;
}) =>
  plugin("transpile", ($monad) =>
    $monad.pipe(
      findOrWatch(watchMode, [`${srcDir}/**/*.ts`]),
      read(),
      plugin.log("TRANSPILING"),
      babel({
        babelrc: false,
        sourceMaps: true,
        comments: comments,
        presets: [
          [
            "@babel/preset-env",
            {
              useBuiltIns: "usage",
              corejs: { version: "3.6" },
              targets: { node: 10 },
              modules: "commonjs",
            },
          ],
          [
            "@babel/preset-typescript",
            {
              isTSX: true,
              allExtensions: true,
              allowNamespaces: true,
            },
          ],
        ],
        ignore: ["**/*.d.ts"],
      }),
      rename((file) => file.replace(/\.tsx?$/, ".js")),
      write(outDir),
      scan(
        (acc, cur) => ({
          successes: acc.successes + 1,
          failures: acc.failures,
          isSuccess: acc.isSuccess,
          isFinalCompilation: !watchMode,
        }),
        { successes: 0, failures: 0, isSuccess: true, isFinalCompilation: true } as HarkCompilationEvent,
      ),
      plugin.log("TRANSPILING DONE"),
    ),
  );

export const copyPackageJson = ({
  gitRepositoryUrl,
  path,
  watchMode,
  writeDir,
}: {
  gitRepositoryUrl?: string;
  path: string;
  watchMode: boolean;
  writeDir: string;
}) =>
  plugin(
    "copyPackageJson",
    plugin.pipe(
      //
      findOrWatch(watchMode, [path]),
      read(),
      jsonParse(),
      packageJsonClean({
        overwrite: (json) => ({
          main: "index.js",
          types: "index.d.ts",
          ...(gitRepositoryUrl
            ? {
                repository: {
                  type: "git",
                  url: gitRepositoryUrl,
                  directory: npath.toPortablePath(npath.relative(process.cwd(), npath.dirname(npath.fromPortablePath(path)))),
                },
              }
            : {}),
        }),
      }),
      // Replace Placeholder
      // map((input) => ({
      //   ...input,
      //   files: input.files.map((file) => {
      //     const contents = file.data.replace(/\b0.0.0-PLACEHOLDER\b/g, version);
      //     return {
      //       ...file,
      //       data: contents,
      //       json: JSON.parse(contents),
      //     };
      //   }),
      // })),
      packageJsonFormat(),
      write(writeDir),
    ),
  );