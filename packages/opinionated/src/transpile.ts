import { HarkCompilationEvent, plugin } from "@hark/plugin";
import { findOrWatch } from "@hark/plugin-find-or-watch";
import { babel } from "@hark/plugin-lib-babel";
import { read } from "@hark/plugin-read";
import { rename } from "@hark/plugin-rename";
import { write } from "@hark/plugin-write";
import { scan } from "rxjs/operators";
export const transpile = ({
  srcDir,
  outDir,
  watchMode,
  comments,
}: {
  watchMode: boolean;
  srcDir: string;
  outDir: string;
  comments?: boolean;
}) =>
  plugin("transpile", ($monad) =>
    $monad.pipe(
      findOrWatch(watchMode, [`${srcDir}/**/*.ts`]),
      read(),
      plugin.log("TRANSPILING"),
      babel({
        babelrc: false,
        sourceMaps: true,
        comments: comments,
        presets: [
          [
            "@babel/preset-env",
            {
              useBuiltIns: "usage",
              corejs: { version: "3.6" },
              targets: { node: 10 },
              modules: "commonjs",
            },
          ],
          [
            "@babel/preset-typescript",
            {
              isTSX: true,
              allExtensions: true,
              allowNamespaces: true,
            },
          ],
        ],
        ignore: ["**/*.d.ts"],
      }),
      rename((file) => file.replace(/\.tsx?$/, ".js")),
      write(outDir),
      scan(
        (acc, cur) => ({
          successes: acc.successes + 1,
          failures: acc.failures,
          isSuccess: acc.isSuccess,
          isFinalCompilation: !watchMode,
        }),
        { successes: 0, failures: 0, isSuccess: true, isFinalCompilation: true } as HarkCompilationEvent,
      ),
      plugin.log("TRANSPILING DONE"),
    ),
  );
