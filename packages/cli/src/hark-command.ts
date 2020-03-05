import { plugin } from "@hark/plugin";
import { reporterVerbose } from "@hark/reporter-verbose";
import { BaseContext, Command } from "clipanion";
import { CommandClass } from "clipanion/lib/advanced/Command";

// export interface HarkCommandClassCommon<E extends {} = {}> {
//   resolveMeta(prototype: Command<E & BaseContext>): Meta<E & BaseContext>;
//   schema?: {
//     validate: (object: any) => void;
//   };
//   usage?: Usage;
// }

export type AbstractCommandConstructor<T> = Function & { prototype: T };

export type HarkCommandClass<E extends {} = {}> = AbstractCommandConstructor<CommandClass<E & BaseContext>>;
// export interface HarkCommandClass<E extends {} = {}> extends CommandClass<E & BaseContext> {
//   new (): HarkCommand<E>;
//   // makeRootMonad<I>(data: I): HarkMonad<I>;
// }

export abstract class HarkCommand<E = {}> extends Command<BaseContext & E> {
  @Command.String("--ll,--logLevel")
  logLevel: string = "2";

  makeRootMonad<I>(data: I) {
    const reporter = reporterVerbose({ logLevel: parseInt(this.logLevel) || 2 });
    const rootMonad = plugin.monadRoot(reporter, [], data);
    return rootMonad;
  }
}
