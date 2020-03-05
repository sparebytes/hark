import { plugin } from "@hark/plugin";
import { findOrWatch } from "@hark/plugin-find-or-watch";
import { jsonParse } from "@hark/plugin-json-parse";
import { read } from "@hark/plugin-read";

export const packageJsonLoad = <I>({ path, watchMode }: { path: string; watchMode?: boolean }) => {
  return plugin<I, Record<string, any>>(
    "packageJsonLoad",
    plugin.pipe(
      findOrWatch(watchMode ?? false, [path]),
      read(),
      jsonParse(),
      plugin.map(({ files }) => {
        if (files.length === 0) {
          throw new Error("Did not find any package.json files at this path: " + path);
        } else if (files.length > 1) {
          throw new Error(`Expected 1 file but received ${files.length} package.json files at this path: ${path}`);
        }
        const json: any = files[0].json;
        if (json == null || typeof json !== "object") {
          throw new Error(`Expected an object for package.json files at this path but received something else: ${path}`);
        }
        return json;
      }),
    ),
  );
};

export default packageJsonLoad;
