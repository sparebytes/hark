import { HarkMonad, HarkPlugin, HarkPluginContext, plugin } from "@hark/plugin";
import { from, Observable, pipe, throwError } from "rxjs";
import { publishReplay, refCount, switchMap } from "rxjs/operators";

export type HarkTaskGroupTasks = Record<string, unknown>;

function makeDeferred<T>() {
  let resolve!: (context: T) => void;
  let reject!: (error: any) => void;
  const promise = new Promise<T>((r1, r2) => {
    resolve = r1;
    reject = r2;
  });
  return {
    promise,
    resolve,
    reject,
  };
}

/** A simple set of tasks */
export class HarkTaskGroup<C extends {}, TASKS extends HarkTaskGroupTasks> {
  private taskGroupContextDefered = makeDeferred<HarkMonad<C>>();
  private readyDefered = makeDeferred<void>();
  private ready$ = from(this.readyDefered.promise);
  private readyTimeoutWarning$ = this.ready$.pipe(
    ($) => $,
    // timeout(3000),
    // catchError((ex) => {
    //   if (ex?.name === "TimeoutError") {
    //     console.warn(".....");
    //     console.warn("Waiting for Monorepo.ready() to be called. Did you forget?");
    //     console.warn("Zzzzzz Zzzzz Zzzzz");
    //     console.warn(".....");
    //     return this.ready$;
    //   } else {
    //     return throwError(ex);
    //   }
    // }),
    // publishReplay(),
    // refCount(),
  );
  constructor(readonly name: string) {}
  // private taskRegistry = new RxSlowMap<string, Observable<any>>();
  private taskRegistry = new Map<string, Observable<any>>();

  registerTask<N extends string, R>(
    taskName: N,
    taskPluginFactory: (this: this, gc: C, context: HarkPluginContext, gc$: HarkMonad<C>) => HarkPlugin<C, R>,
    userOptions?: Partial<{
      cache: boolean;
      scope: boolean;
      resetTrace: boolean;
    }>,
  ): void /* HarkTaskGroup<C, TASKS & { [K in N]: R }> */ {
    const options = userOptions ?? {};
    const cache = options.cache ?? true;
    const scope = options.scope ?? true;
    const resetTrace = options.resetTrace ?? true;
    let task$ = this.readyTimeoutWarning$.pipe(
      switchMap(() => from(this.taskGroupContextDefered.promise)),
      switchMap((taskGroupContext$) =>
        taskGroupContext$.pipe(
          plugin(
            //
            scope ? [this.name, taskName] : null,
            plugin.switchMake((gc, context, gc$) => plugin.pipe(taskPluginFactory.apply(this, [gc, context, gc$]))),
            { resetTrace },
          ),
        ),
      ),
      cache ? pipe(publishReplay(), refCount()) : plugin.noop(),
    );
    this.taskRegistry.set(taskName, task$);
  }

  getTaskObservable<N extends string, R = TASKS[N], F = TASKS[N]>(taskName: N, fallback?: Observable<F>): Observable<R | F> {
    return this.readyTimeoutWarning$.pipe(
      switchMap(() => {
        const value = this.taskRegistry.get(taskName);
        let result: Observable<F | R>;
        if (value !== undefined) {
          result = value;
        } else if (fallback != null) {
          result = fallback;
        } else {
          result = throwError(new Error(`Cannot find task "${taskName}" on task group "${this.name}".`));
        }
        return result;
      }),
    );
  }
  getTask<N extends string, R = TASKS[N], F = TASKS[N]>(
    taskName: N,
    fallbackPlugin?: HarkPlugin<any, F>,
  ): HarkPlugin<any, R | F> {
    return plugin(
      [],
      plugin.switchMap((monad, context, monad$) => {
        const value = this.taskRegistry.get(taskName);
        let result: Observable<R | F>;
        if (value !== undefined) {
          result = value;
        } else if (fallbackPlugin != null) {
          result = plugin([this.name, taskName], fallbackPlugin)(monad$.harkOf(null));
        } else {
          result = throwError(new Error(`Cannot find task "${taskName}" on task group "${this.name}".`)) as any;
        }
        return result;
      }),
    );
  }
  task: {
    [K in keyof TASKS]: {
      (): HarkPlugin<any, TASKS[K]>;
      <F>(fallbackPlugin?: HarkPlugin<any, F>): HarkPlugin<any, TASKS[K] | F>;
    };
  } = new Proxy(this, taskProxyHandler) as any;
  setTaskContext(taskContext$: HarkMonad<C>) {
    this.taskGroupContextDefered.resolve(taskContext$);
    return this;
  }
  ready() {
    this.readyDefered.resolve();
  }
}

const taskProxyHandler = {
  get: (taskGroup: HarkTaskGroup<any, any>, prop: string) => <F>(fallbackPlugin?: HarkPlugin<any, F>) =>
    taskGroup.getTask(prop, fallbackPlugin),
};

// const noValueSymbol = Symbol("noValue");
// class RxSlowMap<K, V> extends Map<K, V> {
//   private subject?: Subject<null>;
//   private subscriberCount: number = 0;
//   private hasChanged() {
//     const subject = this.subject;
//     if (subject != null) {
//       subject.next(null);
//     }
//   }
//   clear(): void {
//     super.clear();
//     this.hasChanged();
//   }
//   delete(key: K): boolean {
//     const result = super.delete(key);
//     this.hasChanged();
//     return result;
//   }
//   forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
//     super.forEach(callbackfn, thisArg);
//   }
//   get(key: K): V | undefined {
//     return super.get(key);
//   }
//   has(key: K): boolean {
//     return super.has(key);
//   }
//   set(key: K, value: V): this {
//     super.set(key, value);
//     this.hasChanged();
//     return this;
//   }
//   onChange<T>(getter: () => T): Observable<T> {
//     return new Observable<T>((subscriber) => {
//       this.subscriberCount++;
//       if (this.subject == null) {
//         this.subject = new Subject();
//       }
//       const emitNextValue = () => {
//         try {
//           const value = getter();
//           subscriber.next(value);
//         } catch (ex) {
//           subscriber.error(ex);
//         }
//       };
//       const subscription = this.subject.subscribe(emitNextValue);
//       emitNextValue();
//       return () => {
//         subscription.unsubscribe();
//         this.subscriberCount--;
//         if (this.subscriberCount === 0) {
//           this.subject!.complete();
//           this.subject = undefined;
//         }
//       };
//     });
//   }
//   get$(key: K): Observable<V | undefined> {
//     return this.onChange(() => this.get(key)).pipe(distinctUntilChanged());
//   }
//   has$(key: K): Observable<boolean> {
//     return this.onChange(() => this.has(key)).pipe(distinctUntilChanged());
//   }
//   getOrElse$<V2>(key: K, defaultValue: V2): Observable<V | V2> {
//     return this.onChange(() => (this.has(key) ? this.get(key)! : defaultValue)).pipe(distinctUntilChanged());
//   }
// }
