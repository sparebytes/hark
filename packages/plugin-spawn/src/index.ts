import { plugin } from "@hark/plugin";
import { Observable } from "rxjs";
import { filter } from "rxjs/operators";
import { Writable } from "stream";

export interface SpawnEventBegin {
  kind: "begin";
  childProcess: HarkSpawnChildProcess;
}
export interface SpawnEventClose {
  kind: "close";
  code: number;
}
export interface SpawnEventStdout {
  kind: "stdout";
  message: string | Buffer;
}
export interface SpawnEventStderr {
  kind: "stderr";
  message: string | Buffer;
}
export type SpawnEvent = SpawnEventBegin | SpawnEventClose | SpawnEventStdout | SpawnEventStderr;

export type HarkSpawnExecOptions = import("execa").Options;
export type HarkSpawnChildProcess = import("execa").ExecaChildProcess;
export interface HarkSpawnOptions {
  logCommand?: boolean;
  eventFilter?: (event: SpawnEvent) => boolean;
  throwOnNonZeroExit?: boolean;
  logStdout?: boolean | "auto";
  logStderr?: boolean | "auto";
  stringifyStdio?: boolean;
  execa?: Partial<HarkSpawnExecOptions>;
}

function throwFn(error: any): never {
  throw error;
}

export const spawn = <I>(cli: string[] | string, userOptions?: HarkSpawnOptions) =>
  plugin(
    "spawn",
    plugin.init(async () => {
      const { default: execa } = await import("execa");
      const options = userOptions ?? {};
      const throwOnNonZeroExit = options?.throwOnNonZeroExit ?? true;
      const eventFilter = options?.eventFilter ?? ((event) => event.kind === "close");
      const logCommand = options?.logCommand ?? true;
      return plugin.switchMap((state: I, { logMessage, reporter, trace: pluginTrace }) => {
        const harkSpawnEvents$ = new Observable<SpawnEvent>((subscriber) => {
          const stringifyStdio = options.stringifyStdio ?? true;
          const stdoutParam = options.execa?.stdout ?? options.execa?.stdio?.[1] ?? "pipe";
          const stderrParam = options.execa?.stderr ?? options.execa?.stdio?.[2] ?? "pipe";
          const stdoutProxy: (chunk: string | Buffer) => void =
            stdoutParam === "ignore" || stdoutParam === "pipe" || stdoutParam == null
              ? () => {}
              : stdoutParam === "inherit"
              ? (chunk) => process.stdout.write(chunk)
              : stdoutParam instanceof Writable
              ? (chunk) => stdoutParam.write(chunk)
              : throwFn(new Error("Invalid value for stdout: " + stdoutParam));
          const stderrProxy: (chunk: string | Buffer) => void =
            stderrParam === "ignore" || stderrParam === "pipe" || stderrParam == null
              ? () => {}
              : stderrParam === "inherit"
              ? (chunk) => process.stderr.write(chunk)
              : stderrParam instanceof Writable
              ? (chunk) => stderrParam.write(chunk)
              : throwFn(new Error("Invalid value for stderr: " + stderrParam));
          let logStdout = options?.logStdout ?? "auto";
          let logStderr = options?.logStderr ?? "auto";
          logStdout =
            logStdout !== "auto" ? logStdout : stdoutParam !== "inherit" && stdoutParam !== 1 && stdoutParam !== process.stdout;
          logStderr =
            logStderr !== "auto" ? logStderr : stderrParam !== "inherit" && stderrParam !== 1 && stderrParam !== process.stderr;
          const stdoutListener = (chunk: string | Buffer) => {
            stdoutProxy(chunk);
            if (stringifyStdio) {
              chunk = chunk.toString("utf8");
              if (logStdout) reporter.emit("stdout", pluginTrace, chunk);
            } else {
              if (logStdout) reporter.emit("stdout", pluginTrace, chunk.toString());
            }
            subscriber.next({ kind: "stdout", message: chunk });
          };
          const stderrListener = (chunk: string | Buffer) => {
            if (logStderr) reporter.emit("stderr", pluginTrace, chunk.toString());
            stderrProxy(chunk);
            subscriber.next({ kind: "stdout", message: chunk });
          };
          const execaOptions: HarkSpawnExecOptions = {
            stripFinalNewline: false,
            env: {
              FORCE_COLOR: "1",
            },
            ...options.execa,
            stdout: "pipe",
            stderr: "pipe",
          };
          let childProcess: HarkSpawnChildProcess;
          if (logCommand) logMessage("$", cli);
          if (typeof cli === "string") {
            childProcess = execa.command(cli, execaOptions);
          } else {
            const [command, ...args] = cli;
            childProcess = execa(command, args, execaOptions);
          }
          childProcess.once("close", (code) => {
            if (throwOnNonZeroExit && code !== 0) {
              subscriber.error(new Error("Command exited with non-zero code: " + code));
            } else {
              subscriber.next({ kind: "close", code: code });
            }
            subscriber.complete();
          });
          childProcess.once("error", (error) => {
            subscriber.error(error);
            subscriber.complete();
          });
          childProcess.stdout!.on("data", stdoutListener);
          childProcess.stderr!.on("data", stderrListener);
          return () => {
            childProcess.stdout?.removeListener("data", stdoutListener);
            childProcess.stderr?.removeListener("data", stderrListener);
          };
        });
        return harkSpawnEvents$.pipe(filter(eventFilter));
      });
    }),
  );

export default spawn;
