import { BaseContext } from "clipanion/lib/advanced";
import * as _path from "path";
import { cliInit } from "./cli-init";
import { HarkCliStartOptions, HarkfileFunction } from "./models";
import { existsSync, promises as fsp } from "fs";

export async function cliStart<T>(args: string[], options?: HarkCliStartOptions<T>) {
  const harkfilePath = _path.resolve(options?.harkfilePath || "./harkfile");
  const cliVars = await cliInit(options);
  const extensions = [".js", ".jsx", ".csj", ".mjs", ".ts", ".tsx"];
  if (options?.registerBabelOptions != null) {
    require("@babel/register")({
      babelrc: true,
      extensions,
      rootMode: "root",
      ...options?.registerBabelOptions,
    });
  }
  let harkFileFn: HarkfileFunction<any, any>;

  if (await fileExists(harkfilePath, [...extensions, ""])) {
    try {
      harkFileFn = (await import(harkfilePath)).default;
    } catch (ex) {
      console.error(`\nError while loading harkfile at "${harkfilePath}".\n`);
      throw ex;
    }
  } else {
    console.error(`\nNo harkfile detected at "${harkfilePath}".\n`);
    harkFileFn = () => undefined;
  }

  let harkfileContext: any;
  try {
    harkfileContext = await harkFileFn(cliVars);
  } catch (ex) {
    console.error(`\nError while running default function exported from harkfile at "${harkfilePath}".\n`);
    throw ex;
  }

  const fullContext: T & BaseContext = {
    stdin: process.stdin,
    stdout: process.stdout,
    stderr: process.stderr,
    ...harkfileContext,
  };
  return cliVars.cli.run(args, fullContext);
}

export async function cliStartExit<T>(args: string[], options?: HarkCliStartOptions<T>) {
  const code = await cliStart(args, options);
  process.exit(code);
}

async function fileExists(filepath: string, extensions: string[] = [""]) {
  for (const extension of extensions) {
    try {
      await fsp.access(`${filepath}${extension}`);
      return true;
    } catch {}
  }
  return false;
}
