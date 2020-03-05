import plugin, { HarkFile, npath, ppath } from "@hark/plugin";

export const rename = <I extends HarkFile>(callback: (file: string) => string) =>
  plugin<{ files: I[] }, { files: I[] }>(
    "rename",
    plugin.map(({ files }: { files: I[] }, { logPath }) => ({
      files: files.map(
        (file): I => {
          const newPath = npath.toPortablePath(callback(file.path));

          if (file.path === newPath) {
            return file;
          }

          logPath(newPath);

          if (file.map) {
            return {
              ...file,
              path: newPath,
              map: {
                ...file.map,
                file: ppath.basename(newPath),
              },
            };
          }

          return {
            ...file,
            path: newPath,
          };
        },
      ),
    })),
  );

export default rename;
