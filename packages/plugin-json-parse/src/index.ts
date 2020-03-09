import plugin, { HarkDataFilesProps, HarkJsonFilesProps } from "@hark/plugin";

export const jsonParse = <T = unknown>(parseFn: (text: string) => any = JSON.parse) =>
  plugin<HarkDataFilesProps, HarkJsonFilesProps<T>>(
    "jsonParse",
    plugin.map(({ files }: HarkDataFilesProps, { logPath }) => {
      const newFiles = files.map((file) => {
        logPath(file.path);
        if (typeof file.data !== "string") {
          throw new Error(`Expected (typeof file.data) === string for file ` + file.path);
        }
        const json = parseFn(file.data);
        return {
          ...file,
          json,
        };
      });
      return {
        files: newFiles,
      } as HarkJsonFilesProps<T>;
    }),
  );

export default jsonParse;
