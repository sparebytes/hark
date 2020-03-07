import { BaseContext } from "clipanion/lib/advanced";
import { promises as fsp } from "fs";
import * as _path from "path";
import { cliInit } from "./cli-init";
import { HarkCliStartOptions, HarkfileFunction } from "./models";

export async function cliStart<T>(args: string[], options?: HarkCliStartOptions<T>) {
  const cliVars = await cliInit(options);
  const extensions: string[] = options?.registerBabelOptions ?? [
    //
    ".ts",
    ".tsx",
    ".mjs",
    ".es",
    ".es6",
    ".csj",
    ".js",
    ".jsx",
  ];
  if (extensions.length === 0) {
    throw new Error("No extensions given");
  }
  if (options?.registerBabelOptions != null) {
    let babelRegister;
    try {
      babelRegister = require("@babel/register");
    } catch (ex) {
      console.error(
        "\n\n@hark/cli: PeerDependency for @babel/register not met. Please set HARK_REGISTER_BABEL=0 if this is intended.\n\n",
      );
      throw ex;
    }
    babelRegister({
      babelrc: true,
      extensions,
      rootMode: "root",
      ...options?.registerBabelOptions,
    });
  }

  const harkfilePath = _path.resolve(options?.harkfilePath || "./harkfile");
  const possibleHarkfiles = [harkfilePath, harkfilePath + _path.sep + "index"].flatMap((p) => extensions.map((e) => p + e));
  const foundHarkfile = await findFirstExistingFile(possibleHarkfiles);
  if (foundHarkfile == null) {
    throw new Error(`\nNo harkfile detected at any of these paths:\n- ` + possibleHarkfiles.join("- \n"));
  }

  let harkFileFn: HarkfileFunction<any, any>;
  try {
    harkFileFn = (await import(foundHarkfile)).default;
  } catch (ex) {
    console.error(`\nError while loading harkfile at "${harkfilePath}".\n`);
    throw ex;
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

async function findFirstExistingFile(filepaths: string[]): Promise<string | undefined> {
  for (const filepath of filepaths) {
    try {
      await fsp.access(filepath);
      return filepath;
    } catch {}
  }
  return undefined;
}
