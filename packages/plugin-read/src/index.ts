import plugin, { HarkDataFile, HarkDataFilesProps, HarkFilesProps } from "@hark/plugin";

export const read = <T extends HarkFilesProps>() =>
  plugin(
    "read",
    plugin.init(async () => {
      const { readFile } = await import("pifs");
      return plugin.switchMap(async ({ files }: T, { logPath }) => {
        const resultFiles = await Promise.all(
          files.map(
            async (file): Promise<HarkDataFile> => {
              logPath(file.path);
              const data = await readFile(file.path, "utf8");
              return {
                path: file.path,
                data,
              };
            },
          ),
        );
        const result: HarkDataFilesProps = { files: resultFiles };
        return result;
      });
    }),
  );

export default read;
