import reporterVerbose from "@hark/reporter-verbose";
import { promises as fsp } from "fs";
import * as _path from "path";
import { HarkCliStartOptions, HarkfileCliFn } from "./models";

export async function cliStart(args: string[], options?: HarkCliStartOptions) {
  const extensions: string[] = options?.registerBabelOptions?.extensions ?? [
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

  let harkfileRunCli: HarkfileCliFn;
  try {
    const harkfileModule = await import(foundHarkfile);
    harkfileRunCli = harkfileModule.runCli;
  } catch (ex) {
    console.error(`\nError while loading harkfile at "${harkfilePath}".\n`);
    throw ex;
  }

  if (harkfileRunCli == null) {
    throw new Error(`\nExpected "runCli" to be exported from ${harkfilePath}\n`);
  }
  if (typeof harkfileRunCli !== "function") {
    throw new Error(`\nExpected "runCli" to be a function.\n`);
  }

  let logLevel = options?.defaultLogLevel ?? 2;
  const logLevelParts = /^\-l(\d+)$/.exec(args[0]);
  if (logLevelParts) {
    logLevel = parseInt(logLevelParts[1]);
    args = args.slice(1);
  }
  const reporter = reporterVerbose({ logLevel });
  return harkfileRunCli(args, { reporter });
}

export async function cliStartExit(args: string[], options?: HarkCliStartOptions) {
  const code = await cliStart(args, options);
  if (typeof code !== "number") {
    throw new Error(`Expected exit code to be numeric but got "${code}" instead.`);
  }
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
