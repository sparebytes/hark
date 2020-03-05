import { HarkfileFunction } from "./models";

export function extendCli<CliContext, ReturnContext>(cliFn: HarkfileFunction<CliContext, ReturnContext>) {
  return cliFn;
}
