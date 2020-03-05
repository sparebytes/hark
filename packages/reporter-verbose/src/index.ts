import chalk from "chalk";
import { EventEmitter } from "events";
import StackUtils from "stack-utils";

type HarkError = Error | string[] | string | null;

export type HarkReporterVerboseGlobalFilter = (eventName: string, pluginTrace: string[], ...args: any[]) => boolean;
export type HarkReporterVerboseStartFilter = (pluginTrace: string[]) => boolean;
export type HarkReporterVerboseInputFilter = (pluginTrace: string[]) => boolean;
export type HarkReporterVerboseMessageFilter = (pluginTrace: string[], message: string, data: any) => boolean;
export type HarkReporterVerbosePathFilter = (pluginTrace: string[], pathToLog: string) => boolean;
export type HarkReporterVerboseOutputFilter = (pluginTrace: string[]) => boolean;
export type HarkReporterVerboseDoneFilter = (pluginTrace: string[]) => boolean;
export type HarkReporterVerboseStdoutFilter = (pluginTrace: string[], message: string) => boolean;
export type HarkReporterVerboseStderrFilter = (pluginTrace: string[], message: string) => boolean;
export interface HarkReporterVerboseOptions {
  readonly printLeftStackMin?: number;
  readonly printRightStackMin?: number;
  readonly logLevel?: number;
  readonly globalFilter?: HarkReporterVerboseGlobalFilter;
  readonly startFilter?: HarkReporterVerboseStartFilter;
  readonly inputFilter?: HarkReporterVerboseInputFilter;
  readonly messageFilter?: HarkReporterVerboseMessageFilter;
  readonly pathFilter?: HarkReporterVerbosePathFilter;
  readonly outputFilter?: HarkReporterVerboseOutputFilter;
  readonly doneFilter?: HarkReporterVerboseDoneFilter;
  readonly stdoutFilter?: HarkReporterVerboseStdoutFilter;
  readonly stderrFilter?: HarkReporterVerboseStderrFilter;
}

export const reporterVerbose = (userOptions?: HarkReporterVerboseOptions) => {
  const options = userOptions ?? {};
  const printLeftStackMin = options.printLeftStackMin ?? 2;
  const printRightStackMin = options.printRightStackMin ?? 4;
  const printStackMax = printLeftStackMin + printRightStackMin;
  const logLevel = options.logLevel != null && Number.isInteger(options.logLevel) ? options.logLevel : null;
  // prettier-ignore
  const globalFilter: HarkReporterVerboseGlobalFilter = options.globalFilter ?? (() => true);
  // prettier-ignore
  const startFilter: HarkReporterVerboseStartFilter = options.startFilter ?? (logLevel == null ? () => true : () => logLevel >= 4);
  // prettier-ignore
  const inputFilter: HarkReporterVerboseInputFilter = options.inputFilter ?? (logLevel == null ? () => true : () => logLevel >= 4);
  // prettier-ignore
  const messageFilter: HarkReporterVerboseMessageFilter = options.messageFilter ?? (logLevel == null ? () => true : () => logLevel >= 1);
  // prettier-ignore
  const pathFilter: HarkReporterVerbosePathFilter = options.pathFilter ?? (logLevel == null ? () => true : () => logLevel >= 5);
  // prettier-ignore
  const outputFilter: HarkReporterVerboseOutputFilter = options.outputFilter ?? (logLevel == null ? () => true : () => logLevel >= 3);
  // prettier-ignore
  const doneFilter: HarkReporterVerboseDoneFilter = options.doneFilter ?? (logLevel == null ? () => true : () => logLevel >= 3);
  // prettier-ignore
  const stdoutFilter: HarkReporterVerboseStdoutFilter = options.stdoutFilter ?? (logLevel == null ? () => true : () => logLevel >= 2);
  // prettier-ignore
  const stderrFilter: HarkReporterVerboseStderrFilter = options.stderrFilter ?? (logLevel == null ? () => true : () => logLevel >= 2);

  const emitter = new EventEmitter();
  const handledErrors = new WeakSet<any>();

  // prettier-ignore
  const eventLabels = {
    start:    chalk.yellowBright      `█░░` + " ", // SRT
    input:    chalk.yellowBright      `▒▒░` + " ", // SRT
    output:   chalk.greenBright       `░▒▒` + " ", // SRT
    done:     chalk.greenBright       `░░█` + " ", // DNE
    message:  chalk.cyanBright        `░█░` + " ", // MSG
    path:     chalk.blueBright        `░▒░` + " ", // PTH
    stdout:   chalk.whiteBright       `░▒░` + " ", // STO
    stderr:   chalk.magentaBright     `░▒░` + " ", // STE
    error:    chalk.redBright         `░█░` + " ", // ERR
  };
  const {
    start: startLabel,
    input: inputLabel,
    output: outputLabel,
    done: doneLabel,
    message: messageLabel,
    path: pathLabel,
    stdout: stdoutLabel,
    stderr: stderrLabel,
    error: errorLabel,
  } = eventLabels;

  const getpluginTraceString = (pluginTrace: string[], chalkFn: (text: string) => string = (l) => l) => {
    const truncatedTrace =
      pluginTrace.length <= printStackMax
        ? pluginTrace
        : [
            ...pluginTrace.slice(0, printLeftStackMin),
            `..${pluginTrace.length - printStackMax}..`,
            ...pluginTrace.slice(-printRightStackMin),
          ];
    const lastIndex = truncatedTrace.length - 1;
    return truncatedTrace
      .map((label, index) => (index === 0 ? chalkFn(label) : index === lastIndex ? chalkFn(label) : chalk.gray(label)))
      .join(" ");
  };

  emitter.on("start", (pluginTrace: string[]) => {
    if (!globalFilter("start", pluginTrace)) return;
    if (!startFilter(pluginTrace)) return;
    console["log"](`${startLabel}${getpluginTraceString(pluginTrace)}`);
  });

  emitter.on("input", (pluginTrace: string[]) => {
    if (!globalFilter("input", pluginTrace)) return;
    if (!inputFilter(pluginTrace)) return;
    console["log"](`${inputLabel}${getpluginTraceString(pluginTrace)}`);
  });

  emitter.on("message", (pluginTrace: string[], message: string, data: any) => {
    if (!globalFilter("message", pluginTrace, message, data)) return;
    if (!messageFilter(pluginTrace, message, data)) return;
    if (data === undefined) {
      console["log"](`${messageLabel}${getpluginTraceString(pluginTrace)}: ${message}`);
    } else {
      console["log"](`${messageLabel}${getpluginTraceString(pluginTrace)}: ${message}`, data);
    }
  });

  emitter.on("stdout", (pluginTrace: string[], message: string) => {
    if (!globalFilter("stdout", pluginTrace, message)) return;
    if (!stdoutFilter(pluginTrace, message)) return;
    console["log"](`${stdoutLabel}${getpluginTraceString(pluginTrace)}> ${message}`);
  });

  emitter.on("stderr", (pluginTrace: string[], message: string) => {
    if (!globalFilter("stderr", pluginTrace, message)) return;
    if (!stderrFilter(pluginTrace, message)) return;
    console["log"](`${stderrLabel}${getpluginTraceString(pluginTrace)}> ${message}`);
  });

  emitter.on("path", (pluginTrace: string[], pathToLog: string) => {
    if (!globalFilter("path", pluginTrace, pathToLog)) return;
    if (!pathFilter(pluginTrace, pathToLog)) return;
    console["log"](`${pathLabel}${getpluginTraceString(pluginTrace)}: ${pathToLog}`);
  });

  emitter.on("output", (pluginTrace: string[]) => {
    if (!globalFilter("output", pluginTrace)) return;
    if (!outputFilter(pluginTrace)) return;
    console["log"](`${outputLabel}${getpluginTraceString(pluginTrace)}`);
  });

  emitter.on("done", (pluginTrace: string[]) => {
    if (!globalFilter("done", pluginTrace)) return;
    if (!doneFilter(pluginTrace)) return;
    console["log"](`${doneLabel}${getpluginTraceString(pluginTrace)}`);
  });

  emitter.on("error", (pluginTrace: string[], error: HarkError, hardCoreTrace?: { labels: string[]; stack?: string }[]) => {
    if (error != null && (typeof error === "object" || typeof error === "function")) {
      if (handledErrors.has(error)) {
        return;
      }
      handledErrors.add(error);
    }
    // hard error
    const pluginTraceString = `${errorLabel}${getpluginTraceString(pluginTrace)}`;
    if (error instanceof Error && typeof error.stack === "string") {
      const stackUtils = new StackUtils({
        cwd: process.cwd(),
        internals: StackUtils.nodeInternals(),
      });
      const stack = stackUtils.clean(error.stack!);

      console.error(`${pluginTraceString}: ${error.message}`);
      console.error(`\n${chalk.red(stack)}`);
      // array of "soft" errors
    } else if (Array.isArray(error)) {
      error.forEach((message) => {
        console.error(`${pluginTraceString}: ${message}`);
      });
      // "soft" error
    } else if (typeof error === "string") {
      console.error(`${pluginTraceString}: ${error}`);
    }

    console.error(`${pluginTraceString}: error`);

    if (hardCoreTrace && hardCoreTrace.length > 0) {
      console.error(hardCoreTrace);
    }
  });

  return emitter;
};

export default reporterVerbose;
