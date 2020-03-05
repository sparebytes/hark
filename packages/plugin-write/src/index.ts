import plugin, { HarkDataFile, HarkDataFilesProps, npath } from "@hark/plugin";

export const write = <T extends HarkDataFilesProps>(outDirRelative: string) =>
  plugin<T, T>(
    "write",
    plugin.init(async () => {
      const { writeFile } = await import("pifs");
      const { default: movePath } = await import("move-path");
      const { default: makeDir } = await import("make-dir");

      return plugin.switchMap(async (input: T, { logPath }) => ({
        ...input,
        files: await Promise.all(
          input.files.map(
            async (file): Promise<HarkDataFile> => {
              outDirRelative = npath.fromPortablePath(outDirRelative);
              const nativePath = npath.fromPortablePath(file.path);
              const outFile = movePath(nativePath, outDirRelative);
              const outDir = npath.dirname(outFile);

              await makeDir(outDir);

              const writeFiles = [];
              let fileData = file.data;

              // sourcemap
              if (file.map != null) {
                const inFile = npath.basename(nativePath);
                // /beep/boop/src/beep/index.js -> .js
                const inExtname = npath.extname(nativePath);
                // index.js -> index.js.map
                const sourcemapFile = `${inFile}.map`;
                // /beep/boop/build/beep/index.js -> /beep/boop/build/beep/index.js.map
                const sourcemapPath = npath.join(outDir, sourcemapFile);
                const sourcemapData = JSON.stringify(file.map);

                // /*# sourceMappingURL=index.css.map */
                if (inExtname === ".css") {
                  fileData += "\n/*# sourceMappingURL=";
                  fileData += sourcemapFile;
                  fileData += " */";
                  // //# sourceMappingURL=index.js.map
                } else {
                  fileData += "\n//# sourceMappingURL=";
                  fileData += sourcemapFile;
                }

                writeFiles.push(
                  writeFile(sourcemapPath, sourcemapData, "utf8").then(() => {
                    logPath(sourcemapPath);
                  }),
                );
              }

              writeFiles.push(
                writeFile(outFile, fileData, "utf8").then(() => {
                  logPath(outFile);
                }),
              );

              await Promise.all(writeFiles);

              return file;
            },
          ),
        ),
      }));
    }),
  );

export default write;
