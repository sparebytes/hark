import { npath, plugin } from "@hark/plugin";
import { findOrWatch } from "@hark/plugin-find-or-watch";
import { jsonParse } from "@hark/plugin-json-parse";
import { packageJsonClean } from "@hark/plugin-package-json-clean";
import { packageJsonFormat } from "@hark/plugin-package-json-format";
import { read } from "@hark/plugin-read";
import { write } from "@hark/plugin-write";

export const copyPackageJson = ({
  gitRepositoryUrl,
  path,
  watchMode,
  writeDir,
}: {
  gitRepositoryUrl?: string;
  path: string;
  watchMode: boolean;
  writeDir: string;
}) =>
  plugin(
    "copyPackageJson",
    plugin.pipe(
      //
      findOrWatch(watchMode, [path]),
      read(),
      jsonParse(),
      packageJsonClean({
        overwrite: (json) => ({
          main: "./lib/index.js",
          types: "./lib/index.d.ts",
          ...(gitRepositoryUrl
            ? {
                repository: {
                  type: "git",
                  url: gitRepositoryUrl,
                  directory: npath.toPortablePath(npath.relative(process.cwd(), npath.dirname(npath.fromPortablePath(path)))),
                },
              }
            : {}),
        }),
      }),
      // Replace Placeholder
      // map((input) => ({
      //   ...input,
      //   files: input.files.map((file) => {
      //     const contents = file.data.replace(/\b0.0.0-PLACEHOLDER\b/g, version);
      //     return {
      //       ...file,
      //       data: contents,
      //       json: JSON.parse(contents),
      //     };
      //   }),
      // })),
      packageJsonFormat(),
      write(writeDir),
    ),
  );
