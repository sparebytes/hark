import plugin, { HarkCompilationEvent } from "@hark/plugin";
import { HarkSpawnOptions, spawn } from "@hark/plugin-spawn";
import { empty, of } from "rxjs";
import { filter, map, scan, switchMap } from "rxjs/operators";

export interface HarkSpawnTscEvent extends HarkCompilationEvent {
  successes: number;
  failures: number;
  isSuccess: boolean;
  isFinalCompilation: boolean;
}

export interface HarkSpawnTscOptions {
  spawnOptions?: HarkSpawnOptions;
  cwd?: string;
  command?: string;
  watch?: boolean;
  compiler?: string;
  project?: string;
  build?: string | string[];
  args?: string[];
  isolatedModules?: boolean;
  skipLibCheck?: boolean;
  sourceMap?: boolean;
  pretty?: boolean;
  noEmit?: boolean;
  declaration?: boolean;
  emitDeclarationOnly?: boolean;
  outDir?: string;
  rootDir?: string;
  baseUrl?: string;
  incremental?: boolean;
  composite?: boolean;
  tsBuildInfoFile?: string;
}

export const spawnTsc = <I>(userOptions?: HarkSpawnTscOptions) => {
  const options = userOptions ?? {};
  const cwd = options.cwd ?? process.cwd();
  const command = options.command ?? "tsc";
  const watchMode = options.watch ?? false;
  const secondaryArgs = options.args ?? [];
  const args: string[] = [command];
  if (options.build != null) {
    if (typeof options.build === "string") {
      args.push("--build", options.build);
    } else if (options.build.length > 0) {
      args.push("--build", ...options.build);
    }
  }
  args.push("--preserveWatchOutput");
  if (options.project != null) {
    args.push("--project", options.project);
  }
  if (options.outDir != null) {
    args.push("--outDir", options.outDir);
  }
  if (options.rootDir != null) {
    args.push("--rootDir", options.rootDir);
  }
  if (options.baseUrl != null) {
    args.push("--baseUrl", options.baseUrl);
  }
  if (options.tsBuildInfoFile != null) {
    args.push("--tsBuildInfoFile");
  }
  if (options.isolatedModules) {
    args.push("--isolatedModules");
  }
  if (options.skipLibCheck) {
    args.push("--skipLibCheck");
  }
  if (options.sourceMap) {
    args.push("--sourceMap");
  }
  if (options.noEmit) {
    args.push("--noEmit");
  }
  if (options.declaration) {
    args.push("--declaration");
  }
  if (options.emitDeclarationOnly) {
    args.push("--emitDeclarationOnly");
  }
  if (options.incremental) {
    args.push("--incremental");
  }
  if (options.composite) {
    args.push("--composite");
  }
  if (options.pretty ?? true) {
    args.push("--pretty");
  }
  if (watchMode) {
    args.push("--watch");
  }
  args.push(...secondaryArgs);

  return plugin(
    "spawnTsc",
    plugin.init(async () => {
      const { default: stripAnsi } = await import("strip-ansi");
      return plugin.pipe(
        spawn(args, {
          ...options.spawnOptions,
          eventFilter: (event) => true,
          execa: {
            preferLocal: true,
            ...options.spawnOptions?.execa,
            stdout: "inherit",
            stderr: "inherit",
            cwd,
          },
        }),
        switchMap((spawnEvent) => {
          if (spawnEvent.kind !== "close" && spawnEvent.kind !== "stdout") return empty();
          let isFailure: boolean = false;
          let isFinalCompilation: boolean = false;
          let passIsDone: boolean = false;
          if (spawnEvent.kind === "close") {
            passIsDone = true;
            if (spawnEvent.code === 0) {
              isFinalCompilation = true;
            } else {
              isFailure = true;
            }
          } else {
            const message = stripAnsi(spawnEvent.message.toString("utf8"));
            isFailure = / - error TS\d{1,6}: /.test(message);
            passIsDone = /Found \d{1,} errors?\. Watching for file changes\./.test(message);
          }
          const result = {
            isFailure,
            isFinalCompilation,
            passIsDone,
          };
          if (passIsDone && !isFinalCompilation) {
            return of(result, {
              reset: true,
            });
          } else {
            return of(result);
          }
        }),
        scan(
          (acc, cur) => {
            if ("reset" in cur) {
              return {
                successes: acc.successes,
                failures: acc.failures,
                isFailure: false,
                isFinalCompilation: false,
                passIsDone: false,
              };
            } else {
              return {
                successes: cur.passIsDone && !cur.isFailure ? acc.successes + 1 : acc.successes,
                failures: cur.passIsDone && cur.isFailure ? acc.failures + 1 : acc.failures,
                isFailure: acc.isFailure || cur.isFailure,
                isFinalCompilation: acc.isFinalCompilation || cur.isFinalCompilation,
                passIsDone: acc.passIsDone || cur.passIsDone,
              };
            }
          },
          {
            successes: 0,
            failures: 0,
            isFailure: false,
            isFinalCompilation: false,
            passIsDone: false,
          },
        ),
        filter(({ passIsDone }) => passIsDone),
        map(({ successes, failures, isFailure, isFinalCompilation }) => ({
          successes,
          failures,
          isSuccess: !isFailure,
          isFinalCompilation,
        })),
      );
    }),
  );
};

export default spawnTsc;
