// dsh-dense-ui — host half.
//
// Registers the durable settings namespace `dense-ui` into the Host settings
// service when one is present. The browser half reads and writes this
// namespace through `settingsScope`, so values persist to the profile's
// `settings.yaml` (the same document the built-in Appearance theme uses).
//
// The schema is built with @deepseek-ai/schemastery because `settings.register`
// resolves the section by CALLING the schema and asks it for `toJSON()` when the
// settings mirror describes namespaces to the browser. That dependency is the
// only runtime import this bundle needs on the host.

import z from "@deepseek-ai/schemastery";

const NAMESPACE = "dense-ui";

// Composition defaults (the "base" layer the user's saved values override).
// They match the dense tweak already in use: 14px/22px body, wider text column,
// composer kept at a fixed width with a percentage fallback.
const DEFAULTS = Object.freeze({
  bodyFontSize: 14,
  bodyLineHeight: 22,
  headingScale: 0.84,
  paragraphSpacing: 8,
  listSpacing: 3,
  chatContentWidth: 1120,
  composerWidth: 992,
  composerMode: "fixed", // "fixed" (px) | "percent" (of the content column)
  composerPercent: 72
});

const DenseUiSchema = z.object({
  bodyFontSize: z.number().min(10).max(24).default(DEFAULTS.bodyFontSize),
  bodyLineHeight: z.number().min(12).max(40).default(DEFAULTS.bodyLineHeight),
  headingScale: z.number().min(0.5).max(1.5).default(DEFAULTS.headingScale),
  paragraphSpacing: z.number().min(0).max(40).default(DEFAULTS.paragraphSpacing),
  listSpacing: z.number().min(0).max(20).default(DEFAULTS.listSpacing),
  chatContentWidth: z.number().min(400).max(2000).default(DEFAULTS.chatContentWidth),
  composerWidth: z.number().min(200).max(1600).default(DEFAULTS.composerWidth),
  composerMode: z.union(["fixed", "percent"]).default(DEFAULTS.composerMode),
  composerPercent: z.number().min(30).max(100).default(DEFAULTS.composerPercent)
});

function apply(ctx) {
  // `settings` is an optional host service: without a settings provider (or on
  // a remote browser) it is absent, and this wiring simply never runs.
  ctx.inject(["settings"], (settingsCtx) => {
    settingsCtx.settings.register(NAMESPACE, DenseUiSchema, { base: { ...DEFAULTS } });
  });
}

export { apply, DEFAULTS, NAMESPACE };
