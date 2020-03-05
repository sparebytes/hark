import plugin, { HarkDataFilesProps, HarkJsonFile, HarkJsonFilesProps } from "@hark/plugin";

export const yamlParse = <I extends HarkDataFilesProps>(parseFn: (text: string) => any = JSON.parse) =>
  plugin(
    "yamlParse",
    plugin.init(async () => {
      const { default: jsyaml } = await import("js-yaml");

      return plugin.map(
        ({ files }: I, { logPath }) =>
          ({
            files: files.map((file) => {
              logPath(file.path);
              if (typeof file.data !== "string") {
                throw new Error(`Expected (typeof file.data) === string for file ` + file.path);
              }
              const json = jsyaml.safeLoad(file.data, { filename: file.path });
              return {
                ...file,
                json,
              } as HarkJsonFile;
            }),
          } as HarkJsonFilesProps),
      );
    }),
  );

export default yamlParse;
