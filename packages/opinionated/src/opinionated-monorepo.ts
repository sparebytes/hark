import { Monorepo } from "@hark/plugin-monorepo";
import { OpinionatedProjectTaskContext, OpinionatedProjectTasks } from "./models";

export class OpinionatedMonorepo<C extends OpinionatedProjectTaskContext, TASKS extends OpinionatedProjectTasks> extends Monorepo<
  OpinionatedProjectTaskContext,
  OpinionatedProjectTasks
> {}
