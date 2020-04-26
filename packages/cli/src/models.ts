export interface HarkfileCliFn {
  (args: string[], options: { reporter: NodeJS.EventEmitter }): Promise<number>;
}

export function makeCli(callback: HarkfileCliFn) {
  return callback;
}

export interface HarkCliStartOptions {
  harkfilePath?: string;
  defaultLogLevel?: number;
  registerBabelOptions?: null | {
    extensions: string[];
    [k: string]: unknown;
  };
}
