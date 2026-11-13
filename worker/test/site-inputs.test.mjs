/*
 * Copyright (c) 2026 Tom Rodriguez ("Toasty")
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import siteInputs from "../../utils/site-inputs.mjs";
import { menuTree, renderDataFile, renderNavFile } from "../../roster.mjs";

function fixture(t) {
    const rootDir = mkdtempSync(join(tmpdir(), "heroiclands-site-inputs-"));
    t.after(() => rmSync(rootDir, { recursive: true, force: true }));
    for (const dir of ["data", "static"]) mkdirSync(join(rootDir, dir));
    writeFileSync(join(rootDir, "data/roster.json"), renderDataFile());
    writeFileSync(join(rootDir, "static/nav.json"), renderNavFile());
    return rootDir;
}

for (const [label, origin, assets] of [
    [
        "default root with configured assets",
        "https://www.internal.heroiclands.org",
        "https://cdn.heroiclands.org",
    ],
    [
        "explicit internal root",
        "https://www.internal.heroiclands.org",
        "https://cdn.internal.heroiclands.org",
    ],
    ["explicit public root", "https://www.heroiclands.org", "https://cdn.heroiclands.org"],
]) {
    test(`${label}: header and published menu agree without changing canonical files`, async (t) => {
        const rootDir = fixture(t);
        const canonical = ["data/roster.json", "static/nav.json"].map((file) =>
            readFileSync(join(rootDir, file), "utf8"),
        );
        const config = Object.freeze({
            rootDir,
            homepage: `${origin}/`,
            site: Object.freeze({ assets }),
        });
        const result = await siteInputs({ config });
        assert.deepEqual(result.navigation, menuTree(undefined, origin));
        assert.deepEqual(JSON.parse(result.files["nav.json"]), result.navigation);
        const entries = result.navigation.flatMap((entry) => [entry, ...(entry.children ?? [])]);
        assert.ok(entries.every((entry) => new URL(entry.url).origin === origin));
        assert.equal(entries.find((entry) => entry.name === "Thalorna").url, `${origin}/thalorna/`);
        assert.equal(result.files["nav.json"], renderNavFile(undefined, origin));
        assert.deepEqual(
            ["data/roster.json", "static/nav.json"].map((file) =>
                readFileSync(join(rootDir, file), "utf8"),
            ),
            canonical,
        );
        assert.deepEqual(readdirSync(rootDir).sort(), ["data", "static"]);
        assert.equal(config.site.assets, assets);
    });
}

for (const file of ["data/roster.json", "static/nav.json"]) {
    for (const problem of ["stale", "missing"]) {
        test(`${problem} canonical ${file} fails before producing build inputs or writing output`, async (t) => {
            const rootDir = fixture(t);
            const target = join(rootDir, file);
            if (problem === "stale") writeFileSync(target, "stale\n");
            else rmSync(target);
            await assert.rejects(
                async () =>
                    siteInputs({
                        config: { rootDir, homepage: "https://www.internal.heroiclands.org/" },
                    }),
                /run `npm run roster`/,
            );
            assert.deepEqual(readdirSync(rootDir).sort(), ["data", "static"]);
            if (problem === "stale") assert.equal(readFileSync(target, "utf8"), "stale\n");
        });
    }
}
