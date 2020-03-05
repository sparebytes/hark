import plugin, { HarkFile, HarkFilesProps, normalizeGlobs, npath } from "@hark/plugin";
import { Observable } from "rxjs";

export const watch = <I>(glob: string | string[], userOptions?: any) =>
  plugin(
    "watch",
    plugin.init(async () => {
      const chokidar = await import("chokidar");
      return plugin.switchMap((state: I, { logPath, logMessage }) => {
        return new Observable<HarkFilesProps>((subscriber) => {
          const options = {
            cwd: process.cwd(),
            persistent: true,
            ...userOptions,
          };
          const initialFiles: HarkFile[] = [];
          let listener = (fileNative: string) => {
            const file = npath.toPortablePath(fileNative);
            logPath(file);
            initialFiles.push({
              path: file,
            });
          };
          const watcher = chokidar.watch(normalizeGlobs(glob, options.cwd), options);
          watcher.on("add", (path) => listener(path));
          watcher.on("change", (path) => listener(path));
          watcher.on("error", subscriber.error);
          watcher.once("ready", async () => {
            subscriber.next({ files: initialFiles });
            logMessage("watching for changes, press ctrl-c to exit");
            listener = (fileNative: string) => {
              const file = npath.toPortablePath(fileNative);
              logPath(file);
              subscriber.next({ files: [{ path: file }] });
            };
            return () => {
              watcher.removeListener("add", listener);
              watcher.removeListener("change", listener);
            };
          });
        });
      });
    }),
  );

export default watch;
