import { TransformOptions } from "@babel/core";
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
  babelOptions,
}: {
  watchMode: boolean;
  srcDir: string;
  outDir: string;
  babelOptions?: TransformOptions;
}) =>
  plugin("transpile", ($monad) =>
    $monad.pipe(
      findOrWatch(watchMode, [`${srcDir}/**/*.ts`]),
      read(),
      plugin.log("TRANSPILING"),
      babel(babelOptions),
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
