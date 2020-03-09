import { cliExtendMonorepo, extendCli, HarkMonorepoCommandContext } from "@hark/cli";
import { plugin } from "@hark/plugin";
import { monorepo } from "@hark/plugin-monorepo";
import { spawn } from "@hark/plugin-spawn";
import { BaseCommand, MyMonorepo, MyPackage } from "../harkfile";

export default extendCli<HarkMonorepoCommandContext<MyMonorepo>, HarkMonorepoCommandContext<MyMonorepo>>(
  async ({ cli, cliRegister }) => {
    return {
      ...(await cliExtendMonorepo(BaseCommand)({ cli, cliRegister })),
      monorepo: monorepo(
        ["foo", "bar"],
        plugin.map(({ packages }) => {
          const myMonorepo = new MyMonorepo(packages.map((p) => new MyPackage(p.packageJson.name, p.path)));
          const foo = myMonorepo.getProject("hark-example-foo");
          const bar = myMonorepo.getProject("hark-example-bar");
          foo.registerTask("dev", () =>
            plugin.pipe(
              //
              foo.task.build(),
              spawn(`node -r @babel/register foo/dist/index.js`),
            ),
          );
          return myMonorepo;
        }),
      ),
    };
  },
);
