import plugin, { HarkDataFilesProps } from "@hark/plugin";

export const overwrite = <I extends HarkDataFilesProps>() =>
  plugin(
    "overwrite",
    plugin.init(async () => {
      const { writeFile } = await import("pifs");
      return plugin.switchMap(async (state: I, { logPath }) => {
        const { files } = state;
        await Promise.all(
          files.map(async (file) => {
            await writeFile(file.path, file.data, "utf8");
            logPath(file.path);
            return file;
          }),
        );
        return state;
      });
    }),
  );

export default overwrite;
