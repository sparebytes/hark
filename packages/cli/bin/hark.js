#!/usr/bin/env node
"use strict";

// Prefer the local installation of Hark
if (require("import-local")(__filename)) {
  // Using local install of Hark
} else {
  const { cliStartExit } = require("../lib/cli-start");
  const HARK_REGISTER_BABEL = process.env["HARK_REGISTER_BABEL"];
  cliStartExit(process.argv.slice(2), {
    registerBabelOptions:
      HARK_REGISTER_BABEL == null || HARK_REGISTER_BABEL === true || /^(yes|true|1|on|)$/i.test(HARK_REGISTER_BABEL)
        ? {}
        : /^\{[\s\S\n]*\}$/i.test(HARK_REGISTER_BABEL)
        ? JSON.parse(HARK_REGISTER_BABEL)
        : null,
  });
}
