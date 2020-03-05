import { Observable, of, OperatorFunction, UnaryFunction } from "rxjs";
import { tap } from "rxjs/operators";
import { HarkOperator, HarkPlugin, HarkReporter } from "./models";

const noop = (x: any) => x;

// prettier-ignore
export function harkPipe<T>(): HarkPlugin<T, T>;
// prettier-ignore
export function harkPipe<T, A>(fn1: HarkOperator<T, A>): HarkPlugin<T, A>;
// prettier-ignore
export function harkPipe<T, A, B>(fn1: HarkOperator<T, A>, fn2: HarkOperator<A, B>): HarkPlugin<T, B>;
// prettier-ignore
export function harkPipe<T, A, B, C>(fn1: HarkOperator<T, A>, fn2: HarkOperator<A, B>, fn3: HarkOperator<B, C>): HarkPlugin<T, C>;
// prettier-ignore
export function harkPipe<T, A, B, C, D>(fn1: HarkOperator<T, A>, fn2: HarkOperator<A, B>, fn3: HarkOperator<B, C>, fn4: HarkOperator<C, D>): HarkPlugin<T, D>;
// prettier-ignore
export function harkPipe<T, A, B, C, D, E>(fn1: HarkOperator<T, A>, fn2: HarkOperator<A, B>, fn3: HarkOperator<B, C>, fn4: HarkOperator<C, D>, fn5: HarkOperator<D, E>): HarkPlugin<T, E>;
// prettier-ignore
export function harkPipe<T, A, B, C, D, E, F>(fn1: HarkOperator<T, A>, fn2: HarkOperator<A, B>, fn3: HarkOperator<B, C>, fn4: HarkOperator<C, D>, fn5: HarkOperator<D, E>, fn6: HarkOperator<E, F>): HarkPlugin<T, F>;
// prettier-ignore
export function harkPipe<T, A, B, C, D, E, F, G>(fn1: HarkOperator<T, A>, fn2: HarkOperator<A, B>, fn3: HarkOperator<B, C>, fn4: HarkOperator<C, D>, fn5: HarkOperator<D, E>, fn6: HarkOperator<E, F>, fn7: HarkOperator<F, G>): HarkPlugin<T, G>;
// prettier-ignore
export function harkPipe<T, A, B, C, D, E, F, G, H>(fn1: HarkOperator<T, A>, fn2: HarkOperator<A, B>, fn3: HarkOperator<B, C>, fn4: HarkOperator<C, D>, fn5: HarkOperator<D, E>, fn6: HarkOperator<E, F>, fn7: HarkOperator<F, G>, fn8: HarkOperator<G, H>): HarkPlugin<T, H>;
// prettier-ignore
export function harkPipe<T, A, B, C, D, E, F, G, H, I>(fn1: HarkOperator<T, A>, fn2: HarkOperator<A, B>, fn3: HarkOperator<B, C>, fn4: HarkOperator<C, D>, fn5: HarkOperator<D, E>, fn6: HarkOperator<E, F>, fn7: HarkOperator<F, G>, fn8: HarkOperator<G, H>, fn9: HarkOperator<H, I>): HarkPlugin<T, I>;
// prettier-ignore
export function harkPipe<T, A, B, C, D, E, F, G, H, I>(fn1: HarkOperator<T, A>, fn2: HarkOperator<A, B>, fn3: HarkOperator<B, C>, fn4: HarkOperator<C, D>, fn5: HarkOperator<D, E>, fn6: HarkOperator<E, F>, fn7: HarkOperator<F, G>, fn8: HarkOperator<G, H>, fn9: HarkOperator<H, I>, ...fns: HarkOperator<any, any>[]): HarkPlugin<T, {}>;

export function harkPipe(...fns: Array<UnaryFunction<any, any>>): UnaryFunction<any, any> {
  return harkPipeFromArray(fns);
}

/** @internal */
export function harkPipeFromArray<T, R>(fns: Array<OperatorFunction<T, R>>): HarkPlugin<T, R> {
  if (!fns || fns.length === 0) {
    return noop;
  } else if (fns.length === 1) {
    const fn = fns[0];
    return function harkPipedOne(obs$): HarkMonad<R> {
      return pluginMonad(fn(obs$), obs$.harkContext);
    };
  } else {
    return function harkPiped(obs$): HarkMonad<R> {
      const context = obs$.harkContext;
      return fns.reduce((prev: HarkMonad<any>, fn) => pluginMonad(fn(prev), context), obs$);
    };
  }
}

export interface HarkPluginContext {
  readonly reporter: HarkReporter;
  readonly logPath: (path: string) => void;
  readonly logMessage: (message: string, data?: any) => void;
  readonly trace: string[];
  readonly hardCoreTrace: { labels: string[]; stackTrace?: string }[];
  readonly previousContext?: HarkPluginContext;
}

export interface HarkMonad<T> extends Observable<T> {
  harkContext: HarkPluginContext;
  harkOf<R>(value: R): HarkMonad<R>;
  harkFrom<R>(value: Observable<R>): HarkMonad<R>;
  // prettier-ignore
  pipe(): HarkMonad<T>;
  // prettier-ignore
  pipe<A>(op1: HarkOperator<T, A>): HarkMonad<A>;
  // prettier-ignore
  pipe<A, B>(op1: HarkOperator<T, A>, op2: HarkOperator<A, B>): HarkMonad<B>;
  // prettier-ignore
  pipe<A, B, C>(op1: HarkOperator<T, A>, op2: HarkOperator<A, B>, op3: HarkOperator<B, C>): HarkMonad<C>;
  // prettier-ignore
  pipe<A, B, C, D>(op1: HarkOperator<T, A>, op2: HarkOperator<A, B>, op3: HarkOperator<B, C>, op4: HarkOperator<C, D>): HarkMonad<D>;
  // prettier-ignore
  pipe<A, B, C, D, E>(op1: HarkOperator<T, A>, op2: HarkOperator<A, B>, op3: HarkOperator<B, C>, op4: HarkOperator<C, D>, op5: HarkOperator<D, E>): HarkMonad<E>;
  // prettier-ignore
  pipe<A, B, C, D, E, F>(op1: HarkOperator<T, A>, op2: HarkOperator<A, B>, op3: HarkOperator<B, C>, op4: HarkOperator<C, D>, op5: HarkOperator<D, E>, op6: HarkOperator<E, F>): HarkMonad<F>;
  // prettier-ignore
  pipe<A, B, C, D, E, F, G>(op1: HarkOperator<T, A>, op2: HarkOperator<A, B>, op3: HarkOperator<B, C>, op4: HarkOperator<C, D>, op5: HarkOperator<D, E>, op6: HarkOperator<E, F>, op7: HarkOperator<F, G>): HarkMonad<G>;
  // prettier-ignore
  pipe<A, B, C, D, E, F, G, H>(op1: HarkOperator<T, A>, op2: HarkOperator<A, B>, op3: HarkOperator<B, C>, op4: HarkOperator<C, D>, op5: HarkOperator<D, E>, op6: HarkOperator<E, F>, op7: HarkOperator<F, G>, op8: HarkOperator<G, H>): HarkMonad<H>;
  // prettier-ignore
  pipe<A, B, C, D, E, F, G, H, I>(op1: HarkOperator<T, A>, op2: HarkOperator<A, B>, op3: HarkOperator<B, C>, op4: HarkOperator<C, D>, op5: HarkOperator<D, E>, op6: HarkOperator<E, F>, op7: HarkOperator<F, G>, op8: HarkOperator<G, H>, op9: HarkOperator<H, I>): HarkMonad<I>;
  // prettier-ignore
  pipe<A, B, C, D, E, F, G, H, I>(op1: HarkOperator<T, A>, op2: HarkOperator<A, B>, op3: HarkOperator<B, C>, op4: HarkOperator<C, D>, op5: HarkOperator<D, E>, op6: HarkOperator<E, F>, op7: HarkOperator<F, G>, op8: HarkOperator<G, H>, op9: HarkOperator<H, I>, ...operations: HarkOperator<any, any>[]): HarkMonad<unknown>;
}

export function pluginMonad<T>(obs: Observable<T>, context: HarkPluginContext) {
  const result: HarkMonad<T> = obs.pipe(tap()) as HarkMonad<T>;
  result.pipe = (...fns: OperatorFunction<any, any>[]) => harkPipeFromArray(fns)(result);
  result.harkContext = context;
  result.harkOf = <R>(value: R) => {
    return pluginMonad(of(value), context);
  };
  result.harkFrom = <R>(value: Observable<R>) => {
    return pluginMonad(value, context);
  };
  return result;
}
