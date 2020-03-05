import { HarkDataFilesProps, plugin } from "@hark/plugin";

export const packageJsonFormat = <I extends HarkDataFilesProps>() => {
  return plugin<I, I>(
    "packageJsonFormat",
    plugin.init(async () => {
      const { default: sortPackageJson }: any = await import("sort-package-json");
      return plugin.pipe(
        plugin.map((input: I) => {
          return {
            ...input,
            files: input.files.map((file) => {
              const sortedFile = {
                ...file,
                data: sortPackageJson(file.data),
              };
              delete sortedFile.map;
              if (sortedFile.json != null) {
                sortedFile.json = JSON.parse(sortedFile.data);
              }
              return sortedFile;
            }),
          };
        }),
      );
    }),
  );
};

export default packageJsonFormat;
