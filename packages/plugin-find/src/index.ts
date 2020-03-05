import plugin, { HarkFile, HarkFilesProps, HarkPlugin, normalizeGlobs, npath } from "@hark/plugin";

export const find = <I>(glob: string | string[], options?: any): HarkPlugin<I, HarkFilesProps> =>
  plugin(
    "find",
    plugin.init(async () => {
      const { default: globby } = await import("globby");
      return plugin.switchMap(async (state: I, { logPath }) => {
        options = {
          cwd: process.cwd(),
          ignore: ["**/node_modules/**"],
          deep: Infinity,
          onlyFiles: false,
          expandDirectories: false,
          absolute: false,
          ...options,
        };
        const globbyFiles = await globby(normalizeGlobs(glob, options.cwd), options);
        const results = {
          files: globbyFiles.map(
            (nativePath): HarkFile => {
              const file = npath.toPortablePath(nativePath);
              logPath(file);
              return { path: file };
            },
          ),
        };
        return results;
      });
    }),
  );

export default find;
