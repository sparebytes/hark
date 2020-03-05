import plugin, { HarkDataFile, HarkDataFilesProps, HarkFilesProps } from "@hark/plugin";

type Options = {
  [key: string]: any;
};

export const prettierEslint = <I extends HarkFilesProps>(options?: Options) =>
  plugin(
    "prettierEslint",
    plugin.init(async () => {
      // @ts-ignore
      const { default: format } = await import("prettier-eslint");
      return plugin.switchMap(async ({ files }: I, { logPath }) => {
        const newFiles = await Promise.all(
          files.map(
            (file) =>
              new Promise<HarkDataFile>((resolve) => {
                const formatted: string = format({
                  ...options,
                  filePath: file.path,
                  text: file.data,
                });

                if (file.data !== formatted) {
                  logPath(file.path);
                }

                resolve({
                  ...file,
                  data: formatted,
                });
              }),
          ),
        );
        return { files: newFiles } as HarkDataFilesProps;
      });
    }),
  );

export default prettierEslint;
