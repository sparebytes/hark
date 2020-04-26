import { HarkJsonFilesProps } from "@hark/plugin";
import { BaseProjectContext, BaseProjectTasks } from "@hark/plugin-monorepo";
import { TsconfigData } from "@hark/plugin-tsconfig";
import { ITsconfigExportedPaths } from "./tsconfig-exported-paths";

export interface OpinionatedProjectTaskContext extends BaseProjectContext {
  devDebounceTime: number;
  gitRepositoryUrl?: string;
  release: boolean;
}

export interface OpinionatedProjectTasks extends BaseProjectTasks {
  clean: unknown;
  typescriptCompile: unknown;
  tsconfigGen: HarkJsonFilesProps<TsconfigData>;
  tsconfigDataPartial: TsconfigData;
  tsconfigData: TsconfigData;
  babelTranspile: unknown;
  babelTranspileDependencies: unknown;
  babelTranspileSelf: unknown;
  tsconfigExportedPaths: ITsconfigExportedPaths;
}
