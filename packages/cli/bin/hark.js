#!/usr/bin/env node
"use strict";

// Prefer the local installation of Hark
if (require("import-local")(__filename)) {
  // Using local install of Hark
} else {
  require("../lib/_cli.js");
}
