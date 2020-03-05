import { OperatorFunction, UnaryFunction } from "rxjs";
import { HarkMonad } from "./monad";
import { PortablePath } from "./path";

export interface HarkFile {
  path: PortablePath;
  data?: string;
  json?: unknown;
  map?: {};
}
export interface HarkFilesProps {
  files: HarkFile[];
}
export interface HarkDataFile extends HarkFile {
  data: string;
}
export interface HarkDataFilesProps {
  files: HarkDataFile[];
}
export interface HarkJsonFile<T = unknown> extends HarkDataFile {
  json: T;
}
export interface HarkJsonFilesProps<T = unknown> {
  files: HarkJsonFile<T>[];
}

export interface HarkCompilationEvent {
  successes: number;
  failures: number;
  isSuccess: boolean;
  isFinalCompilation: boolean;
}

export type HarkReporter = NodeJS.EventEmitter;

export type HarkPlugin<I, O> = UnaryFunction<HarkMonad<I>, HarkMonad<O>>;
export type HarkOperator<I, O> = HarkPlugin<I, O> | OperatorFunction<I, O>;

export type HarkPluginLabels = string[] | string | null | undefined;

export type HarkPluginsArrayFrom<I, O extends unknown[]> = { [K in keyof O]: HarkPlugin<I, O[K]> };
