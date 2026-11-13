/*
 * Copyright (c) 2026 Tom Rodriguez ("Toasty")
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderDataFile, renderNavFile } from "../roster.mjs";

/** Canonical committed projections always use the public origin. */
export function rosterProjections() {
    return {
        "data/roster.json": renderDataFile(),
        "static/nav.json": renderNavFile(),
    };
}

/** Refuse missing or stale authored projections before generating build inputs. */
export function checkRosterProjections(rootDir) {
    const findings = [];
    for (const [file, expected] of Object.entries(rosterProjections())) {
        let actual;
        try {
            actual = readFileSync(join(rootDir, file), "utf8");
        } catch {
            findings.push(`${file}:1:1: error: missing; run \`npm run roster\``);
            continue;
        }
        if (actual !== expected) {
            findings.push(`${file}:1:1: error: does not match roster.mjs; run \`npm run roster\``);
        }
    }
    if (findings.length) throw new Error(findings.join("\n"));
}
