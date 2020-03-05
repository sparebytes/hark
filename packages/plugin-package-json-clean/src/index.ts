import plugin, { HarkJsonFilesProps } from "@hark/plugin";

export interface PackageJsonCleanOptions {
  keep?: Iterable<string>;
  overwrite?: (inputJson: any) => any;
  indent?: number;
}

const keepDefault = [
  "name",
  "version",
  "description",
  "keywords",
  "author",
  "license",
  "main",
  "types",
  "exports",
  "files",
  "publishConfig",
  "engines",
  "dependencies",
  "peerDependencies",
  // "devDependencies",
  "bin",
];

export const packageJsonClean = <I extends HarkJsonFilesProps>(options?: PackageJsonCleanOptions) => {
  const keep = new Set(options?.keep ?? keepDefault);
  const overwrite = options?.overwrite ?? ((j) => j);
  const indent = options?.indent ?? 2;
  return plugin(
    "packageJsonClean",
    plugin.map(({ files }: I, { logPath }) => {
      const newFiles = files.map((file) => {
        logPath(file.path);
        const newJson: any = {
          ...Object.fromEntries(Object.entries(file.json as any).filter(([key]) => keep.has(key))),
          ...overwrite(file.json),
        };
        const newData = JSON.stringify(newJson, undefined, indent);
        return {
          ...file,
          map: undefined,
          data: newData,
          json: newJson,
        };
      });
      return { files: newFiles } as HarkJsonFilesProps;
    }),
  );
};

export default packageJsonClean;
