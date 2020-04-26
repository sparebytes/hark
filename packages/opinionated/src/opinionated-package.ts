import { TransformOptions } from "@babel/core";
import { npath, plugin, PortablePath, ppath } from "@hark/plugin";
import { find } from "@hark/plugin-find";
import { remove } from "@hark/plugin-remove";
import { spawn } from "@hark/plugin-spawn";
import { of } from "rxjs";
import { map } from "rxjs/operators";
import { OpinionatedProjectTaskContext, OpinionatedProjectTasks } from "./models";
import { OpinionatedProject } from "./opinionated-project";
import { transpile } from "./transpile";
import { TsconfigExportedPaths } from "./tsconfig-exported-paths";

export class OpinionatedPackage<
  C extends OpinionatedProjectTaskContext,
  TASKS extends OpinionatedProjectTasks
> extends OpinionatedProject<C, TASKS> {
  declare path: PortablePath;
  constructor(
    name: string,
    path: string,
    {
      srcDir = "src",
      distDir = "dist",
      outDir = `${distDir}/lib`,
      tsconfigExtends,
      babelOptions,
    }: { srcDir?: string; outDir?: string; distDir?: string; tsconfigExtends?: string; babelOptions?: TransformOptions } = {},
  ) {
    super({ name, path, sourcePaths$: of([`${path}/${srcDir}/**/*.ts`, `!**/*.test.ts`]) });

    // format
    this.registerTask("format", () =>
      plugin.pipe(
        //
        this.task.sourcePaths(plugin.of([])),
        plugin.switchMake((paths) => spawn(["prettier", "--write", ...paths], { logCommand: false })),
      ),
    );

    // clean
    this.registerTask("clean", () =>
      plugin.pipe(
        //
        find([`${this.path}/**/${distDir}`, `${this.path}/**/*.tsbuildinfo`, `!**/node_modules/**`]),
        remove(),
      ),
    );

    // babelTranspileSelf
    this.registerTask("babelTranspileSelf", (gc) =>
      transpile({ watchMode: gc.watchMode, srcDir: `${path}/${srcDir}`, outDir: `${path}/${outDir}`, babelOptions }),
    );

    // tsconfigExportedPaths
    this.registerTask("tsconfigExportedPaths", () =>
      plugin.pipe(
        this.task.tsconfigData(plugin.of(null)),
        map((tsconfigData) => {
          const outDir = tsconfigData?.compilerOptions?.outDir;
          if (!outDir) return TsconfigExportedPaths.none();
          return TsconfigExportedPaths.factory(this.name, this.path, { ".": [`${outDir}/index`], "./*": [`${outDir}/*`] });
        }),
      ),
    );

    // tsconfigDataPartial
    this.registerTask("tsconfigDataPartial", () =>
      plugin.of({
        extends:
          tsconfigExtends ??
          ppath.join(
            ppath.relative(npath.toPortablePath(path), npath.toRelativePortablePath(process.cwd())),
            "tsconfig.base.json" as PortablePath,
          ),
        compilerOptions: {
          baseUrl: ".",
          rootDir: srcDir,
          outDir: outDir,
          isolatedModules: true,
          skipLibCheck: true,
          sourceMap: false,
          declaration: true,
          emitDeclarationOnly: true,
          composite: true,
        },
        include: [srcDir],
        exclude: ["**/*.test.ts", "**/*.test.tsx"],
      }),
    );

    // tsconfigData
    this.registerTask("tsconfigData", () =>
      plugin.pipe(
        this.withDependencies((pg) =>
          plugin.combineLatest(
            this.task.tsconfigDataPartial(),
            pg.tasks.tsconfigExportedPaths(plugin.of(TsconfigExportedPaths.none())).combineLatestArray(),
          ),
        ),
        map(([partialConfig, pathsArray]) => {
          const baseUrl = (partialConfig?.compilerOptions?.baseUrl || ".") as PortablePath;
          const paths = TsconfigExportedPaths.merge(
            pathsArray.map(([project, paths]) => paths.makeCompilerOptions(ppath.join(this.path, baseUrl))),
          );
          const data = {
            ...partialConfig,
            compilerOptions: {
              ...partialConfig?.compilerOptions,
              baseUrl,
              paths: {
                ...paths,
                ...partialConfig?.compilerOptions?.paths,
              },
            },
          };
          return data;
        }),
      ),
    );
  }
}
