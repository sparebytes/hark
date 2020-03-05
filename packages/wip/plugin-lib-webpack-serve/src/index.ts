import { find } from "@hark/plugin-find";
import { Options as TOptions } from "webpack-serve";

export default (options: TOptions, argv: {} = {}) =>
  plugin("webpackServe", () => async () => {
    const { default: serve } = await import("webpack-serve");

    await serve(argv, options);
  });
