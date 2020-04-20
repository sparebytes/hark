import { Filename, HarkJsonFile, PortablePath, ppath } from "@hark/plugin";
import * as crypto from "crypto";

export interface TsconfigData {
  extends?: string;
  compilerOptions?: {
    baseUrl?: string;
    rootDir?: string;
    outDir?: string;
    isolatedModules?: boolean;
    skipLibCheck?: boolean;
    sourceMap?: boolean;
    noEmit?: boolean;
    declaration?: boolean;
    emitDeclarationOnly?: boolean;
    incremental?: boolean;
    composite?: boolean;
    tsBuildInfoFile?: string;
    [k: string]: unknown;
  };
  files?: string[];
  include?: string[];
  exclude?: string[];
  references?: { path: string; [k: string]: unknown }[];
  [k: string]: unknown;
}

export function generateTsconfigFile(options: {
  relDir?: PortablePath;
  fileDir: PortablePath;
  filenamePrefix?: string | null;
  filenameSuffix?: string | null;
  filenameHash?: boolean | number;
  referencePaths?: PortablePath[];
  data: TsconfigData;
}): HarkJsonFile {
  const fileDir = options.fileDir;
  const filenamePrefix = options.filenamePrefix;
  const filenameSuffix = options.filenameSuffix;
  const relDir = options.relDir ?? options.fileDir;
  const relPath = ppath.relative(fileDir, relDir);
  const filenameHash = options.filenameHash;
  const data = options.data;
  const references =
    options.referencePaths == null || options.referencePaths.length === 0
      ? undefined
      : options.referencePaths.map((p) => ({
          path: ppath.beginWithDot(ppath.relative(fileDir, p)),
        }));
  const dataCompilerOptions = data.compilerOptions ?? {};
  const json = {
    ...data,
    extends:
      data.extends == null
        ? undefined
        : /^[\.\/]/.test(data.extends) // Make sure extends begins with a dot or forward slash to ensure it's a relative import and not an absolute import from node_modules
        ? ppath.beginWithDot(ppath.join(relPath, data.extends as PortablePath))
        : data.extends,
    compilerOptions: {
      ...dataCompilerOptions,
      baseUrl: dataCompilerOptions.baseUrl == null ? undefined : ppath.join(relPath, dataCompilerOptions.baseUrl as PortablePath),
      rootDir: dataCompilerOptions.rootDir == null ? undefined : ppath.join(relPath, dataCompilerOptions.rootDir as PortablePath),
      outDir: dataCompilerOptions.outDir == null ? undefined : ppath.join(relPath, dataCompilerOptions.outDir as PortablePath),
    },
    files: data.files?.map((p) => ppath.join(relPath, p as PortablePath)),
    include: data.include?.map((p) => ppath.join(relPath, p as PortablePath)),
    exclude: data.exclude?.map((p) => ppath.join(relPath, p as PortablePath)),
    references: data.references == null ? references : references == null ? data.references : [...data.references, ...references],
  };
  let contents = JSON.stringify(json, undefined, 2);
  const filename = `${filenamePrefix ?? ""}${
    filenameHash === true
      ? generateHash(contents, 6)
      : typeof filenameHash === "number"
      ? generateHash(contents, filenameHash)
      : ""
  }${filenameSuffix ?? ""}` as Filename;
  if (!json.compilerOptions.tsBuildInfoFile) {
    json.compilerOptions.tsBuildInfoFile = `${filename}.tsbuildinfo`;
    contents = JSON.stringify(json, undefined, 2);
  }
  const tsconfigPath = ppath.join(fileDir, filename);
  const result: HarkJsonFile = {
    path: tsconfigPath,
    data: contents,
    json: json,
  };
  return result;
}

function generateHash(input: string, truncate: number = Number.POSITIVE_INFINITY): string {
  let hash = crypto.createHash("sha1").update(input).digest("hex").substring(0, truncate);
  return hash;
}
