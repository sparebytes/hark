import { find } from "@hark/plugin-find";
import { watch } from "@hark/plugin-watch";

export const findOrWatch = <I>(watchMode: boolean, glob: string | string[], options?: any) =>
  watchMode ? watch<I>(glob, options) : find<I>(glob, options);
