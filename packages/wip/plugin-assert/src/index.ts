import { find } from "@hark/plugin-find";

export default (value: any, message?: string) =>
  plugin("assert", () => async () => {
    const { default: assertLib } = await import("assert");

    assertLib(value, message);
  });
