import { npath, Path, PortablePath, ppath } from "@hark/plugin";

export interface ITsconfigExportedPaths {
  makeCompilerOptions(newRelPath: Path): Record<string, string[]>;
}

const tsconfigExportedPathsNone: ITsconfigExportedPaths = {
  makeCompilerOptions: (newRelPath: Path): Record<string, string[]> => ({}),
};

export class TsconfigExportedPaths implements ITsconfigExportedPaths {
  constructor(
    readonly packageName: PortablePath,
    readonly relPath: PortablePath,
    readonly importPaths: {
      readonly [k: string]: PortablePath[];
    },
  ) {}
  static factory(packageName: string, relPath: Path, importPaths: Record<string, Path[]>) {
    const newRelPath = npath.toRelativePortablePath(relPath);
    const newImportPaths: Record<string, PortablePath[]> = {};
    for (const k in importPaths) {
      const v = importPaths[k];
      if (typeof v === "string") {
        throw new Error("Expected a an array of strings but just got a string: " + v);
      }
      newImportPaths[k] = v.map((p) => npath.toRelativePortablePath(p));
    }
    return new TsconfigExportedPaths(packageName as PortablePath, newRelPath, newImportPaths);
  }
  static none(): ITsconfigExportedPaths {
    return tsconfigExportedPathsNone;
  }
  static merge(pathsArray: Record<string, string[]>[]) {
    const results: Record<string, string[]> = {};
    for (const paths of pathsArray) {
      for (const k in paths) {
        const resultsK = (results[k] = results[k] ?? []);
        resultsK.push(...paths[k]);
      }
    }
    return results;
  }
  makeCompilerOptions(newRelPath: Path): Record<string, string[]> {
    const importPathPrefix = ppath.relative(npath.toRelativePortablePath(newRelPath), this.relPath);
    const newImportPaths: Record<string, PortablePath[]> = {};
    for (const k in this.importPaths) {
      newImportPaths[ppath.join(this.packageName, k as PortablePath)] = this.importPaths[k].map((p) =>
        ppath.join(importPathPrefix, p),
      );
    }
    return newImportPaths;
  }
}
