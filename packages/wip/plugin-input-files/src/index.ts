import plugin, { HarkFile, HarkFilesProps, HarkPlugin, MaybeObject } from "@hark/plugin";

export default <R extends MaybeObject>(target: HarkPlugin<HarkFilesProps, R>) => (...files: string[]) =>
  plugin("inputFiles", (utils) => async () => {
    const path = await import("path");

    const targetRunner = await target;

    return targetRunner(utils.reporter)({
      files: files.map(
        (file): HarkFile => ({
          path: path.resolve(file),
        }),
      ),
    });
  });
