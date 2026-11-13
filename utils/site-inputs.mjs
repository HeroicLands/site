/*
 * Copyright (c) 2026 Tom Rodriguez ("Toasty")
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { menuTree, renderNavFile } from "../roster.mjs";
import { checkRosterProjections } from "./roster-projections.mjs";

/**
 * Supply the root site's menu and published navigation to package-build.
 * Canonical source checks precede selected-origin generation and never write.
 * The builder resolves the root and assets; this provider only consumes them.
 */
export default function siteInputs({ config }) {
    checkRosterProjections(config.rootDir);
    const origin = new URL(config.homepage).origin;
    return {
        navigation: menuTree(undefined, origin),
        files: { "nav.json": renderNavFile(undefined, origin) },
    };
}
