import { HarkJsonFilesProps, plugin, PortablePath } from "@hark/plugin";
import { BaseProjectOptions, Project } from "@hark/plugin-monorepo";
import { spawnTsc } from "@hark/plugin-spawn-tsc";
import { generateTsconfigFile, TsconfigData } from "@hark/plugin-tsconfig";
import { write } from "@hark/plugin-write";
import { debounceTime, map } from "rxjs/operators";
import { OpinionatedProjectTaskContext, OpinionatedProjectTasks } from "./models";

export class OpinionatedProject<C extends OpinionatedProjectTaskContext, TASKS extends OpinionatedProjectTasks> extends Project<
  C,
  TASKS
> {
  constructor(options: BaseProjectOptions) {
    super(options);
    // clean
    this.registerTask("clean", () => plugin.warn("Nothing to do apparently"));
    // buildRoot
    this.registerTask("buildRoot", (gc) =>
      plugin.pipe(
        plugin.log("Starting Build Root"),
        plugin.combineLatestArray([
          //
          this.task.build(),
          this.task.typescriptCompile(),
        ]),
        debounceTime(gc.devDebounceTime),
        plugin.log("Done Build Root"),
      ),
    );
    // build
    this.registerTask("build", () =>
      plugin.ifEmpty(
        plugin.combineLatestArray([
          this.task.buildDependencies(plugin.warn(`"buildDependencies" task not implemented. Doing Nothing.`)),
          this.task.babelTranspileSelf(plugin.warn(`"babelTranspileSelf" task is not implemented. Doing nothing.`)),
        ]),
        plugin.warn("Nothing to do apparently"),
      ),
    );
    // typescriptCompile
    this.registerTask("typescriptCompile", (gc) =>
      plugin.pipe(
        this.task.tsconfigGen(),
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
          this.task.tsconfigData(plugin.of(null)),
          this.withDependencies((deps) => deps.tasks.tsconfigGen().combineLatestArray()),
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
