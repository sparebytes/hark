import { cliExtendMonorepo, extendCli, HarkMonorepoCommandContext, HarkMonorepoCommand } from "@hark/cli";
import { plugin, PortablePath } from "@hark/plugin";
import { BaseProjectContext, BaseProjectOptions, BaseProjectTasks, monorepo, Project, Monorepo } from "@hark/plugin-monorepo";

export interface AProjectTaskContext extends BaseProjectContext {
  version: string;
}

export interface AProjectTasks extends BaseProjectTasks<AProjectTaskContext> {}

export class AProject extends Project<AProjectTaskContext, AProjectTasks> {
  constructor(options: BaseProjectOptions) {
    super(options);
  }
}

export class APackage extends AProject {
  declare path: PortablePath;
  constructor(name: string, path: string) {
    super({ name, path });
  }
}

export class AMonorepo extends Monorepo<AProjectTaskContext, AProjectTasks> {}

export abstract class ACommand extends HarkMonorepoCommand<AMonorepo, "version"> {
  monadDefaults() {
    return {
      version: require("./package.json").version as string,
      devDebounceTime: 100,
    };
  }
}

export default extendCli(async ({ cli, cliRegister }) => {
  return {
    ...(await cliExtendMonorepo(ACommand)({ cli, cliRegister })),
    monorepo: monorepo(
      ["packages/*/dist"],
      plugin.map(({ packages }) => new AMonorepo(packages.map((p) => new APackage(p.packageJson.name, p.path)))),
    ),
  };
});
