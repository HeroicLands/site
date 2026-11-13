/*
 * Copyright (c) 2026 Tom Rodriguez ("Toasty")
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Write or check the committed canonical public projections of roster.mjs.
 * Selected-root build inputs are supplied separately by site-inputs.mjs.
 *
 * Usage:
 *   node utils/build-roster.mjs          # write both canonical files
 *   node utils/build-roster.mjs --check  # refuse missing or stale projections
 *   node utils/build-roster.mjs --help   # show usage
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkRosterProjections, rosterProjections } from "./roster-projections.mjs";

const rootDir = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
if (args.length === 1 && (args[0] === "-h" || args[0] === "--help")) {
    console.log(`Usage: node utils/build-roster.mjs [--check | -h | --help]

With no arguments, write both canonical roster files.
--check       Refuse missing or stale projections.
-h, --help    Show this help.`);
} else if (args.length && (args.length !== 1 || args[0] !== "--check")) {
    console.error("build-roster: expected no arguments, --check, -h, or --help");
    process.exitCode = 2;
} else if (args[0] === "--check") {
    try {
        checkRosterProjections(rootDir);
        console.log("data/roster.json and static/nav.json are current.");
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
} else {
    for (const [file, content] of Object.entries(rosterProjections())) {
        const target = join(rootDir, file);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, content);
        console.log(`Wrote ${file}`);
    }
}
