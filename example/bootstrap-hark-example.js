// process.env["HARK_HARD_CORE_TRACE"] = "1";
require("@babel/register")({
  babelrc: true,
  extensions: [".js", ".jsx", ".csj", ".mjs", ".ts", ".tsx"],
  rootMode: "upward",
  only: [
    function(filepath) {
      const r = /[\/\\]node_modules[\/\\]/.test(filepath) == false;
      return r;
    },
  ],
});
const { myMonorepoPlugin } = require("./hark");
const { default: cli } = require("../src/cli");
cli.runExit(process.argv.slice(2), {
  stdin: process.stdin,
  stdout: process.stdout,
  stderr: process.stderr,
  monorepo: myMonorepoPlugin,
});
