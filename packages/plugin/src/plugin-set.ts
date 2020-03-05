import { empty } from "rxjs";
import { HarkPlugin, HarkPluginsArrayFrom } from "./models";
import { plugin } from "./plugin";

export class PluginsSet<I, O extends any[]> {
  constructor(readonly projectTasks: HarkPluginsArrayFrom<I, O>) {}

  private returnEmptySetWarning(): HarkPlugin<any, never> {
    const error = new Error("An empty set was given with no fallback.");
    console.error(error);
    return plugin.pipe(
      plugin.warnState("An empty set was given with no fallback.", () => error),
      plugin.from(empty()),
    );
  }

  combineLatest(): HarkPlugin<I, O>;
  combineLatest<F>(emptySetFallback: HarkPlugin<I, F>): HarkPlugin<I, O | F>;
  combineLatest<F>(emptySetFallback?: HarkPlugin<I, F>): HarkPlugin<I, O | F> {
    if (this.projectTasks.length === 0) {
      if (emptySetFallback) {
        return emptySetFallback;
      } else {
        return this.returnEmptySetWarning();
      }
    }
    return plugin.combineLatest<I, O>(...(this.projectTasks as any));
  }
  combineLatestArray(): HarkPlugin<I, (O extends (infer Z)[] ? Z : never)[]>;
  combineLatestArray<F extends any[]>(
    emptySetFallback: HarkPlugin<I, F>,
  ): HarkPlugin<I, ((O extends (infer Z)[] ? Z : never) | (F extends (infer Z)[] ? Z : never))[]>;
  combineLatestArray<F extends any[]>(
    emptySetFallback?: HarkPlugin<I, F>,
  ): HarkPlugin<
    I,
    F extends (infer F0)[] ? ((O extends (infer Z)[] ? Z : never) | F0)[] : (O extends (infer Z)[] ? Z : never)[] | F
  > {
    return plugin.combineLatestArray<I, O extends (infer Z)[] ? Z : never, F>(this.projectTasks as any, emptySetFallback);
  }
  concat(): O extends (infer Z)[] ? HarkPlugin<I, Z> : never;
  concat<F>(emptySetFallback: HarkPlugin<I, F>): HarkPlugin<I, (O extends (infer Z)[] ? Z : never) | F>;
  concat<F>(emptySetFallback?: HarkPlugin<I, F>): HarkPlugin<I, (O extends (infer Z)[] ? Z : never) | F> {
    if (this.projectTasks.length === 0) {
      if (emptySetFallback) {
        return emptySetFallback;
      } else {
        return this.returnEmptySetWarning();
      }
    }
    return plugin.concat<I, HarkPlugin<I, (O extends (infer Z)[] ? Z : never) | F>>(...this.projectTasks) as any;
  }
  merge(): O extends (infer Z)[] ? HarkPlugin<I, Z> : never;
  merge<F>(emptySetFallback: HarkPlugin<I, F>): HarkPlugin<I, (O extends (infer Z)[] ? Z : never) | F>;
  merge<F>(emptySetFallback?: HarkPlugin<I, F>): HarkPlugin<I, (O extends (infer Z)[] ? Z : never) | F> {
    if (this.projectTasks.length === 0) {
      if (emptySetFallback) {
        return emptySetFallback;
      } else {
        return this.returnEmptySetWarning();
      }
    }
    return plugin.merge<I, HarkPlugin<I, (O extends (infer Z)[] ? Z : never) | F>>(...this.projectTasks) as any;
  }
}
