import plugin, { HarkFilesProps } from "@hark/plugin";

export const remove = <I extends HarkFilesProps>() =>
  plugin(
    "remove",
    plugin.init(async () => {
      const { default: dleet } = await import("dleet");
      return plugin.switchMap(async ({ files }: I, { logPath }) => {
        await Promise.all(
          files.map(async (file) => {
            await dleet(file.path);
            logPath(file.path);
          }),
        );
      });
    }),
  );

export default remove;
