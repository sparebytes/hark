import { combineLatest, concat, from, merge, Observable, of, OperatorFunction, throwError, UnaryFunction } from "rxjs";
import { defaultIfEmpty, map, switchMap, tap } from "rxjs/operators";
import { HarkPlugin, HarkPluginLabels, HarkPluginsArrayFrom, HarkReporter } from "./models";
import { HarkMonad, harkPipe, HarkPluginContext, pluginMonad } from "./monad";

const emptyLabelReplacement: string[] = [];

function normalizeLabels(labels: HarkPluginLabels): string[] {
  return !labels
    ? emptyLabelReplacement
    : typeof labels === "string"
    ? [labels]
    : labels.length === 0
    ? emptyLabelReplacement
    : labels;
}

/**
 * HarkPlugin: The canonical method for creating a Hark plugin
 * - inherits trace from previous plugins
 * - passes traces to following plugins
 * - reports start/done
 */
export const plugin = <I, O>(
  labels: HarkPluginLabels,
  op: UnaryFunction<HarkMonad<I>, Observable<O>>,
  options?: {
    resetTrace?: boolean;
  },
): HarkPlugin<I, O> => {
  const resetTrace = options?.resetTrace ?? false;
  const labelsNormal = normalizeLabels(labels);
  const logStartDone = labelsNormal.length > 0;
  const hardCoreTraceFragement = plugin.hardCoreTraceEnabled
    ? {
        labels: labelsNormal,
        stackTrace: new Error().stack,
      }
    : undefined;
  return (input$: HarkMonad<I>) => {
    const inputContext = input$.harkContext;
    const reporter = inputContext.reporter;
    const trace = resetTrace ? labelsNormal : [...inputContext.trace, ...labelsNormal];
    const innerContext = {
      ...inputContext,
      ...getReportTraceBindings(reporter, trace),
      trace: trace,
    };
    if (hardCoreTraceFragement !== undefined) {
      innerContext.hardCoreTrace = [...innerContext.hardCoreTrace, hardCoreTraceFragement];
    }
    const inner$ = pluginMonad(input$, innerContext);
    const outer$ = pluginMonad(
      inner$.pipe(
        tap(() => logStartDone && reporter.emit("start", trace)),
        op as OperatorFunction<I, O>,
        tap(
          () => logStartDone && reporter.emit("done", trace),
          (error) => reporter.emit("error", trace, error, innerContext.hardCoreTrace),
        ),
      ),
      input$.harkContext,
    );
    return outer$;
  };
};

/** HarkPlugin */
plugin.noop = <I>(): OperatorFunction<I, I> => (monad$) => monad$;

/** HarkPlugin: Always throw an error */
plugin.pipe = harkPipe;

/** Config: allows for insane traces */
var _hardCoreTrace: any = process.env["HARK_HARD_CORE_TRACE"];
plugin.hardCoreTraceEnabled = _hardCoreTrace != null && !/^\s*(0|off|false|no)\s*$/.test(_hardCoreTrace);

/** HarkPlugin: Always throw an error */
plugin.throwError = <I>(error: any): HarkPlugin<I, never> => plugin("Error", () => throwError(error));

/** HarkPlugin: Log the state at this point */
plugin.messageState = <I>(
  type: "error" | "log" | "warn" | "trace" = "log",
  label?: string | null,
  tranformFn: (state: I) => any = (state) => state,
): HarkPlugin<I, I> => (monad$) =>
  monad$.pipe(
    tap((state) => {
      const context = monad$.harkContext;
      context.logMessage(label ?? "", tranformFn(state));
    }),
  );

/** HarkPlugin: log */
plugin.logState = <I>(label?: string | null, tranformFn: (state: I) => any = (state) => state): HarkPlugin<I, I> =>
  plugin.messageState("log", label, tranformFn);

/** HarkPlugin: warn */
plugin.warnState = <I>(label?: string | null, tranformFn: (state: I) => any = (state) => state): HarkPlugin<I, I> =>
  plugin.messageState("warn", label, tranformFn);

/** HarkPlugin: error */
plugin.errorState = <I>(label?: string | null, tranformFn: (state: I) => any = (state) => state): HarkPlugin<I, I> =>
  plugin.messageState("error", label, tranformFn);

/** HarkPlugin: trace */
plugin.traceState = <I>(label?: string | null, tranformFn: (state: I) => any = (state) => state): HarkPlugin<I, I> =>
  plugin.messageState("trace", label, tranformFn);

/** HarkPlugin: Log the state at this point */
plugin.message = <I>(type: "error" | "log" | "warn" | "trace" = "log", label?: string | null): HarkPlugin<I, I> =>
  plugin.messageState(type, label, () => undefined);

/** HarkPlugin: log */
plugin.log = <I>(label?: string | null): HarkPlugin<I, I> => plugin.message("log", label);

/** HarkPlugin: warn */
plugin.warn = <I>(label?: string | null): HarkPlugin<I, I> => plugin.message("warn", label);

/** HarkPlugin: error */
plugin.error = <I>(label?: string | null): HarkPlugin<I, I> => plugin.message("error", label);

/** HarkPlugin: trace */
plugin.trace = <I>(label?: string | null): HarkPlugin<I, I> => plugin.message("trace", label);

export type HarkPluginMaker<I, O> =
  | Promise<HarkPlugin<I, O>>
  | Observable<HarkPlugin<I, O>>
  | (() => Promise<HarkPlugin<I, O>> | Observable<HarkPlugin<I, O>>);

/** HarkPlugin: Wraps a plugin from the given Promise or Observable */
plugin.make = <I, O>(pluginMaker: HarkPluginMaker<I, O>): HarkPlugin<I, O> => {
  const childPlugin$: Observable<HarkPlugin<I, O>> = typeof pluginMaker === "function" ? from(pluginMaker()) : from(pluginMaker);
  return plugin([], (input$: HarkMonad<I>) => childPlugin$.pipe(switchMap((transformer) => transformer(input$))));
};

/**
 * HarkPlugin: Useful when a plugin is initializing to import libraries and initiate state.
 * Just an alias for plugin.make
 */
plugin.init = plugin.make;

/**
 * HarkPlugin: Wraps a higher-ordered-plugin (which returns another plugin)
 * @deprecated Try using plugin.switchMake instead.
 */
plugin.makeHigher = <I1, I2, O>(
  thePluginInput: HarkPlugin<I1, I2>,
  higherOrderPlugin: HarkPlugin<I1, HarkPlugin<I2, O>>,
): HarkPlugin<I1, O> => {
  return plugin([], (input0$) => {
    const result$ = input0$.pipe(
      switchMap((input1) => {
        const input1$ = input0$.harkOf(input1);
        const input2$ = input0$.harkFrom(input1$.pipe(thePluginInput));
        const output$ = input1$.pipe(
          higherOrderPlugin,
          switchMap((thePlugin2: HarkPlugin<I2, O>) => thePlugin2(input2$)),
          map((z) => z),
        );
        return output$;
      }),
    );
    return result$;
  });
};

/** HarkPlugin: Sets the state from a value */
plugin.of = <I, O>(value: O): HarkPlugin<I, O> => (input$) => input$.pipe(map(() => value));

/** HarkPlugin: Sets the state from an Observable */
plugin.from = <I, O>(value: Observable<O> | Promise<O>): HarkPlugin<I, O> => plugin.switchMap(() => from(value));

/** HarkPlugin: Sets the state from the value returne by the mapping function */
plugin.map = <I, O>(fn: (state: I, context: HarkPluginContext, monad: HarkMonad<I>) => O): HarkPlugin<I, O> => (input$) =>
  input$.pipe(map((input) => fn(input, input$.harkContext, input$.harkOf(input))));

/** HarkPlugin: Map the state to a value from an Observable */
plugin.switchMap = <I, O>(
  fn: (state: I, context: HarkPluginContext, monad: HarkMonad<I>) => Observable<O> | Promise<O>,
): HarkPlugin<I, O> => (input$) => input$.pipe(switchMap((input) => from(fn(input, input$.harkContext, input$.harkOf(input)))));

/** HarkPlugin: Map the state to a value from an Observable */
plugin.switchMake = <I, O>(
  fn: (state: I, context: HarkPluginContext, monad: HarkMonad<I>) => HarkPlugin<I, O>,
): HarkPlugin<I, O> =>
  plugin.switchMap((monad, context, monad$) => {
    const thePlugin = fn(monad, context, monad$);
    return thePlugin(monad$);
  });

/** HarkPlugin: Collect plugins */
plugin.collect = <I, P extends HarkPlugin<I, any>[]>(
  ...plugins: P
): HarkPlugin<I, { [K in keyof P]: P[K] extends HarkPlugin<any, infer O> ? HarkMonad<O> : never }> => {
  const result = plugin.switchMap((m, c, m$: HarkMonad<I>) =>
    plugin
      .of(plugins)(m$)
      .pipe(map((plugins) => plugins.map((p) => p(m$)))),
  );
  return result as any;
};

const isEmptySymbol = Symbol("harkIsEmpty");

/** HarkPlugin: Like rxjs defaultIsEmpty operator but instead the fallback is provided by another plugin and both input plugins take the same inputs */
plugin.ifEmpty = <I, O, F>(thePlugin: HarkPlugin<I, O>, fallback: HarkPlugin<I, F>): HarkPlugin<I, O | F> => {
  return plugin.switchMap((v, c, v$) => {
    return thePlugin(v$).pipe(
      defaultIfEmpty<O, symbol>(isEmptySymbol),
      switchMap((value) => (value === isEmptySymbol ? fallback(v$) : of(value as O))),
    );
  });
};

/** HarkPlugin: Like rxjs static combineLatest but for plugins */
plugin.combineLatest = <I, O extends any[]>(...plugins: HarkPluginsArrayFrom<I, O>): HarkPlugin<I, O> =>
  plugin.switchMap((monad: I, context: HarkPluginContext, monad$: HarkMonad<I>) =>
    combineLatest(...plugins.map((p) => p(monad$))),
  ) as any;

/** HarkPlugin: Like rxjs static combineLatest but for an arbirary array of plugins. If the list is empty then it returns an empty array */
plugin.combineLatestArray = <I, O, F>(
  plugins: HarkPlugin<I, O>[],
  fallback?: HarkPlugin<I, F>,
): HarkPlugin<
  I,
  F extends (infer F0)[] ? ((O extends (infer Z)[] ? Z : never) | F0)[] : (O extends (infer Z)[] ? Z : never)[] | F
> =>
  plugins.length === 0
    ? fallback ?? plugin.of([] as O[])
    : (plugin.switchMap((monad: I, context: HarkPluginContext, monad$: HarkMonad<I>) =>
        combineLatest(...plugins.map((p) => p(monad$))),
      ) as any);

/** HarkPlugin: Like rxjs static concat but for plugins */
plugin.concat = <I, O>(...plugins: HarkPlugin<I, O>[]): HarkPlugin<I, O> =>
  plugin.switchMap((monad, context, monad$) => concat(...plugins.map((p) => p(monad$))));

/** HarkPlugin: Like rxjs static merge but for plugins */
plugin.merge = <I, O>(...plugins: HarkPlugin<I, O>[]): HarkPlugin<I, O> =>
  plugin.switchMap((monad, context, monad$) => merge(...plugins.map((p) => p(monad$))));

/** HarkMonad: Starting Monad */
plugin.monadRoot = <I>(reporter: HarkReporter, label: HarkPluginLabels, initialState: I): HarkMonad<I> => {
  const trace = normalizeLabels(label);
  return pluginMonad(of(initialState), {
    reporter,
    ...getReportTraceBindings(reporter, trace),
    trace: [],
    hardCoreTrace: [],
  });
};

/** HarkMonad: Starting Monad */
plugin.monadError = (error: any): HarkMonad<never> => {
  const context: HarkPluginContext = {
    trace: ["ERROR MONAD"],
    hardCoreTrace: [],
  } as any;
  const result = pluginMonad(throwError(error), context as HarkPluginContext);
  return result;
};

/** HarkPluginMonad */
plugin.monad = pluginMonad;

/** Utility */
function getReportTraceBindings(reporter: HarkReporter, trace: string[]) {
  return {
    logPath: (path: string) => {
      reporter.emit("path", trace, path);
    },
    logMessage: (message: string, data?: any) => {
      reporter.emit("message", trace, message, data);
    },
  };
}
