import { HarkJsonFilesProps, HarkPlugin, plugin, ppath } from "@hark/plugin";
import { find } from "@hark/plugin-find";
import { jsonParse } from "@hark/plugin-json-parse";
import { read } from "@hark/plugin-read";
import { tap } from "rxjs/operators";
import { Monorepo } from "./monorepo";

export type ProjectFactoryPackageInfo = { path: string; packageJson: { name: string; [k: string]: unknown } };

export const monorepoBuilderPlugin = <M extends Monorepo<any, any>>(
  pathGlobs: string[],
  monorepoFactory: HarkPlugin<{ packages: ProjectFactoryPackageInfo[] }, M>,
) =>
  plugin<M["_C"], M>(
    "monorepo",
    plugin.switchMake((monad, context, monad$) =>
      plugin.pipe(
        find(pathGlobs),
        plugin.switchMake(({ files }) => find(files.map((file) => `${file.path}/package.json`))),
        read(),
        jsonParse(),
        plugin.map(({ files }: HarkJsonFilesProps<unknown>) => {
          return {
            packages: files.map(
              (f) =>
                ({
                  path: ppath.dirname(f.path),
                  packageJson: f.json,
                } as ProjectFactoryPackageInfo),
            ),
          };
        }),
        monorepoFactory,
        tap((theMonorepo) => {
          theMonorepo.setTaskContext(monad$);
          theMonorepo.ready();
        }),
      ),
    ),
  );

export default monorepoBuilderPlugin;
