import plugin, { HarkMonad, HarkPlugin } from "@hark/plugin";
import { Monorepo } from "@hark/plugin-monorepo";
import { map } from "rxjs/operators";
import { AbstractCommandConstructor, HarkCommand } from "./hark-command";

export type HarkMonorepoCommandClass = AbstractCommandConstructor<HarkMonorepoCommand<any, any>>;

// export interface HarkMonorepoCommandClass<M extends Monorepo<any, any>, E = {}> extends HarkCommandClass<E> {
//   new (): HarkMonorepoCommand<M, E>;
//   // makeMonorepoMonad<I extends M["_C"]>(data: I): HarkMonad<I>;
//   // makeMonorepo$<I extends M["_C"]>(context: I): HarkMonad<M>;
//   // useMonorepo$<I extends M["_C"], R>(context: I, callback: (monorepo: M) => Observable<R>): Observable<R>;
// }

export interface HarkMonorepoCommandContext<M extends Monorepo<any, any>> {
  monorepo: HarkPlugin<M["_C"], M>;
  rootProjectFilter: string;
  allProjectsFilter: string;
  defaultTasks: {
    clean: "clean";
    format: "format";
    buildRoot: "buildRoot";
    compareImportsToPackageJson: "compareImportsToPackageJson";
    packageJsonFormat: "packageJsonFormat";
    dev: "dev";
    [k: string]: string | undefined;
  };
}

export abstract class HarkMonorepoCommand<
  M extends Monorepo<any, any>,
  D extends keyof M["_C"] = never,
  E = {}
> extends HarkCommand<HarkMonorepoCommandContext<M> & E> {
  monadDefaults():
    | Promise<
        {
          [K in D]: M["_C"][K];
        }
      >
    | {
        [K in D]: M["_C"][K];
      } {
    return {} as any;
  }

  makeMonorepoMonad<I extends Omit<M["_C"], D | "monorepo"> & Partial<Pick<M["_C"], D>>>(data: I) {
    return this.makeRootMonad(undefined).pipe(
      plugin.from(Promise.resolve(this.monadDefaults())),
      map((defaults) => ({
        ...defaults,
        ...data,
      })),
    );
  }
  makeMonorepo$<I extends Omit<M["_C"], D | "monorepo"> & Partial<Pick<M["_C"], D>>>(context: I): HarkMonad<M> {
    return this.makeMonorepoMonad(context).pipe(this.context.monorepo);
  }
}
