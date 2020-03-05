import { cliStartExit } from "./cli-start";

const HARK_REGISTER_BABEL = process.env["HARK_REGISTER_BABEL"];

cliStartExit(process.argv.slice(2), {
  registerBabelOptions:
    HARK_REGISTER_BABEL == null || (HARK_REGISTER_BABEL as any) === true || /^yes|true|1|on$/i.test(HARK_REGISTER_BABEL)
      ? {}
      : null,
  context: {
    stdin: process.stdin,
    stdout: process.stdout,
    stderr: process.stderr,
  },
});
