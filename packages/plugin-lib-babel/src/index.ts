import { TransformOptions } from "@babel/core";
import plugin, { HarkDataFile, HarkDataFilesProps } from "@hark/plugin";

export const babel = <I extends HarkDataFilesProps>(userOptions?: TransformOptions) =>
  plugin(
    "babel",
    plugin.init(async () => {
      const { transform } = await import("@babel/core");
      return plugin.switchMap(async ({ files }: I, { logPath }) => ({
        files: await Promise.all(
          files.reduce((result, file): HarkDataFile[] => {
            const options: TransformOptions = {
              ...userOptions,
              ast: false,
              inputSourceMap: file.map != null ? file.map : false,
              filename: file.path,
            };
            const transformed = transform(file.data, options);

            if (transformed !== null) {
              if (typeof transformed.code !== "string") {
                return result;
              }

              const dataFile: HarkDataFile = {
                ...file,
                path: file.path,
                data: transformed.code,
              };

              if (options.sourceMaps && transformed.map) {
                dataFile.map = transformed.map;
              } else {
                delete dataFile.map;
              }

              logPath(file.path);

              result.push(dataFile);
            }

            return result;
          }, [] as HarkDataFile[]),
        ),
      }));
    }),
  );

export default babel;
