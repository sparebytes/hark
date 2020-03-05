import plugin, { HarkFilesProps, npath } from "@hark/plugin";

export const copy = <I extends HarkFilesProps>(outDirRelative: string) =>
  plugin(
    "copy",
    plugin.init(async () => {
      const path = await import("path");
      const { default: movePath } = await import("move-path");
      const { default: makeDir } = await import("make-dir");
      const { default: copie } = await import("copie");
      return plugin.switchMap(async (state: I, { logPath }) => {
        await Promise.all(
          state.files.map(async (file) => {
            const outFile = movePath(file.path, outDirRelative);
            const outDir = path.dirname(outFile);

            await makeDir(outDir);
            // [ ] TODO: Fix: Handle Directories!
            await copie(npath.fromPortablePath(file.path), outFile);

            logPath(outFile);

            return file;
          }),
        );
        return state;
      });
    }),
  );

export default copy;
