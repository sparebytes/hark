// process.env["HARK_HARD_CORE_TRACE"] = "1";
require("@babel/register")({
  babelrc: true,
  extensions: [".csj", ".es", ".es6", ".js", ".jsx", ".mjs", ".ts", ".tsx"],
  rootMode: "root",
});
const { cliStartExit } = require("@hark/cli");
cliStartExit(process.argv.slice(2), {
  context: {
    stdin: process.stdin,
    stdout: process.stdout,
    stderr: process.stderr,
  },
});
