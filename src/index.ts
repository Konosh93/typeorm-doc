import * as program from "commander";
import { generateDocs } from "./lib/generateDocs";

const version = require("../package.json").version;
program.version(version);

program.parse(process.argv);

generateDocs(process.argv[2], process.argv[3], process.argv[4]);
