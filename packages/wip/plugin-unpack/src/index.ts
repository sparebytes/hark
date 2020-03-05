import plugin, { HarkFile, HarkFilesProps } from "@hark/plugin";

export default (outDir: string) =>
  plugin("unpack", ({ logPath }) => async ({ files }: HarkFilesProps) => {
    const path = await import("path");
    const { default: unpack } = await import("decompress");

    return {
      files: (
        await Promise.all(
          files.map(async (file) => {
            const unpackedFiles = await unpack(file.path, outDir);

            return unpackedFiles.map(
              (unpackedFile): HarkFile => {
                const fullPath = path.resolve(outDir, unpackedFile.path);

                logPath(fullPath);

                return {
                  path: fullPath,
                };
              },
            );
          }),
        )
      ).reduce((result, next) => result.concat(next), [] as HarkFile[]),
    };
  });
