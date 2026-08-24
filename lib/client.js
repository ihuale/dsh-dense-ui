// dsh-dense-ui — browser half.
//
// Provides the whole feature on the client:
//  1. Injects a <style> element that re-maps the product's markdown typography
//     and layout CSS variables from the current settings (live preview + the
//     values applied on every page load).
//  2. Registers a "Dense UI" section into the Web Settings surface with sliders
//     for font size, line height, heading scale, paragraph/list spacing, chat
//     content width and composer width. Every change re-renders the CSS
//     immediately (live preview) and writes that one field through
//     `settingsScope.set`, so it persists to the profile's settings.yaml.
//
// This file is plain JavaScript executed through the `dsh.client` module table
// (`window.__ModuleLoader__.load`). React is provided by the runtime; no JSX or
// TypeScript here.

window.__ModuleLoader__.load({
  id: "dsh-dense-ui",
  factory: (require) => {
    const react = require("react");
    const reactJsxRuntime = require("react/jsx-runtime");
    const h = reactJsxRuntime.jsx;
    const jsxs = reactJsxRuntime.jsxs;

    const NAMESPACE = "dense-ui";

    const DEFAULTS = {
      bodyFontSize: 14,
      bodyLineHeight: 22,
      headingScale: 0.84,
      paragraphSpacing: 8,
      listSpacing: 3,
      chatContentWidth: 1120,
      composerWidth: 992,
      composerMode: "fixed", // "fixed" (px) | "percent" (of the content column)
      composerPercent: 72
    };

    // Markdown heading base sizes (px), scaled by headingScale below.
    const HEADING_BASE = { h1: 24, h2: 22, h3: 20, h4: 16 };

    function clamp(value, min, max) {
      const n = Number(value);
      if (!Number.isFinite(n)) return min;
      return Math.min(max, Math.max(min, n));
    }

    // Merge a settings snapshot over defaults, clamping into sane ranges.
    function normalize(raw) {
      const s = (raw && typeof raw === "object") ? raw : {};
      return {
        bodyFontSize: clamp(s.bodyFontSize ?? DEFAULTS.bodyFontSize, 10, 24),
        bodyLineHeight: clamp(s.bodyLineHeight ?? DEFAULTS.bodyLineHeight, 12, 40),
        headingScale: clamp(s.headingScale ?? DEFAULTS.headingScale, 0.5, 1.5),
        paragraphSpacing: clamp(s.paragraphSpacing ?? DEFAULTS.paragraphSpacing, 0, 40),
        listSpacing: clamp(s.listSpacing ?? DEFAULTS.listSpacing, 0, 20),
        chatContentWidth: clamp(s.chatContentWidth ?? DEFAULTS.chatContentWidth, 400, 2000),
        composerWidth: clamp(s.composerWidth ?? DEFAULTS.composerWidth, 200, 1600),
        composerMode: s.composerMode === "percent" ? "percent" : "fixed",
        composerPercent: clamp(s.composerPercent ?? DEFAULTS.composerPercent, 30, 100)
      };
    }

    // Build the CSS text that applies the density. Everything is driven by the
    // product's own CSS custom properties, so the overrides are minimal and
    // reversible.
    function buildCss(cfg) {
      const bh = (px) => clamp(Math.round(px * cfg.headingScale), 10, 40);
      const lh = (px) => clamp(Math.round(px * cfg.headingScale * 1.4), 12, 48);

      const composeMax = cfg.composerMode === "percent"
        ? `min(${cfg.composerPercent}%, ${cfg.composerWidth}px)`
        : `${cfg.composerWidth}px`;

      return [
        "/* dsh-dense-ui */",
        "body {",
        `  --dsw-font-markdown-base: ${cfg.bodyFontSize}px/${cfg.bodyLineHeight}px var(--dsw-font-family) !important;`,
        `  --dsw-font-markdown-base-strong: 600 ${cfg.bodyFontSize}px/${cfg.bodyLineHeight}px var(--dsw-font-family) !important;`,
        `  --dsw-font-markdown-base-italic: italic ${cfg.bodyFontSize}px/${cfg.bodyLineHeight}px var(--dsw-font-family) !important;`,
        `  --dsw-font-markdown-base-strong-italic: italic 600 ${cfg.bodyFontSize}px/${cfg.bodyLineHeight}px var(--dsw-font-family) !important;`,
        `  --dsw-font-markdown-h1: 700 ${bh(HEADING_BASE.h1)}px/${lh(HEADING_BASE.h1)}px var(--dsw-font-family) !important;`,
        `  --dsw-font-markdown-h2: 700 ${bh(HEADING_BASE.h2)}px/${lh(HEADING_BASE.h2)}px var(--dsw-font-family) !important;`,
        `  --dsw-font-markdown-h3: 700 ${bh(HEADING_BASE.h3)}px/${lh(HEADING_BASE.h3)}px var(--dsw-font-family) !important;`,
        `  --dsw-font-markdown-h4: 600 ${bh(HEADING_BASE.h4)}px/${lh(HEADING_BASE.h4)}px var(--dsw-font-family) !important;`,
        "}",
        ".wSkVaW_root {",
        `  --dsh-chat-content-width: ${cfg.chatContentWidth}px !important;`,
        `  --dsh-composer-card-max-width: ${composeMax} !important;`,
        "}",
        "[class*=\"markdown\"] p {",
        `  margin: ${cfg.paragraphSpacing}px 0 !important;`,
        "}",
        "[class*=\"markdown\"] :where(ul, ol) {",
        `  margin: ${cfg.paragraphSpacing}px 0 !important;`,
        "}",
        "[class*=\"markdown\"] li:not(:first-child) {",
        `  margin-top: ${cfg.listSpacing}px !important;`,
        "}",
        "[class*=\"markdown\"] li::marker {",
        `  line-height: ${cfg.bodyLineHeight}px !important;`,
        "}"
      ].join("\n");
    }

    // --- React settings panel -------------------------------------------------

    function Slider(props) {
      const { label, value, min, max, step, unit, onChange } = props;
      return jsxs("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          marginBottom: "14px"
        },
        children: [
          jsxs("div", {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline"
            },
            children: [
              h("span", {
                style: { fontSize: "13px", lineHeight: "18px", color: "var(--dsw-alias-label-primary)" },
                children: label
              }),
              h("span", {
                style: {
                  fontSize: "12px",
                  lineHeight: "18px",
                  color: "var(--dsw-alias-label-secondary)",
                  fontVariantNumeric: "tabular-nums"
                },
                children: value + (unit || "")
              })
            ]
          }),
          h("input", {
            type: "range",
            min,
            max,
            step,
            value,
            onChange: (event) => onChange(Number(event.target.value)),
            style: { width: "100%" }
          })
        ]
      });
    }

    function Select(props) {
      const { label, value, options, onChange } = props;
      return jsxs("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
          gap: "12px"
        },
        children: [
          h("span", {
            style: { fontSize: "13px", lineHeight: "18px", color: "var(--dsw-alias-label-primary)" },
            children: label
          }),
          h("select", {
            value,
            onChange: (event) => onChange(event.target.value),
            style: {
              background: "var(--dsw-alias-bg-layer-1)",
              color: "var(--dsw-alias-label-primary)",
              border: "1px solid var(--dsw-alias-border-l2)",
              borderRadius: "6px",
              padding: "4px 8px",
              fontSize: "13px"
            },
            children: options.map((opt) => h("option", { value: opt.value, children: opt.label }, opt.value))
          })
        ]
      });
    }

    function DenseUiPanel(props) {
      const { cfg, onChange } = props;
      const set = (field) => (value) => onChange(field, value);

      return jsxs("div", {
        style: { display: "flex", flexDirection: "column", width: "100%" },
        children: [
          h("div", {
            style: {
              fontSize: "12px",
              lineHeight: "18px",
              color: "var(--dsw-alias-label-tertiary)",
              marginBottom: "12px"
            },
            children: "改动立即预览并自动保存到 settings.yaml。"
          }),
          h(Slider, {
            label: "正文字号",
            value: cfg.bodyFontSize, min: 10, max: 24, step: 1, unit: "px",
            onChange: set("bodyFontSize")
          }),
          h(Slider, {
            label: "正文行高",
            value: cfg.bodyLineHeight, min: 12, max: 40, step: 1, unit: "px",
            onChange: set("bodyLineHeight")
          }),
          h(Slider, {
            label: "标题缩放",
            value: Math.round(cfg.headingScale * 100), min: 50, max: 150, step: 5, unit: "%",
            onChange: (v) => set("headingScale")(v / 100)
          }),
          h(Slider, {
            label: "段落间距",
            value: cfg.paragraphSpacing, min: 0, max: 40, step: 1, unit: "px",
            onChange: set("paragraphSpacing")
          }),
          h(Slider, {
            label: "列表项间距",
            value: cfg.listSpacing, min: 0, max: 20, step: 1, unit: "px",
            onChange: set("listSpacing")
          }),
          h(Slider, {
            label: "聊天内容区宽度",
            value: cfg.chatContentWidth, min: 400, max: 2000, step: 8, unit: "px",
            onChange: set("chatContentWidth")
          }),
          h(Slider, {
            label: "输入框宽度",
            value: cfg.composerWidth, min: 200, max: 1600, step: 8, unit: "px",
            onChange: set("composerWidth")
          }),
          h(Select, {
            label: "输入框宽度模式",
            value: cfg.composerMode,
            options: [
              { value: "fixed", label: "固定像素" },
              { value: "percent", label: "百分比（小屏自适应）" }
            ],
            onChange: set("composerMode")
          }),
          cfg.composerMode === "percent"
            ? h(Slider, {
                label: "输入框宽度百分比",
                value: cfg.composerPercent, min: 30, max: 100, step: 1, unit: "%",
                onChange: set("composerPercent")
              })
            : null
        ]
      });
    }

    // --- plugin body ----------------------------------------------------------

    const inject = ["slots", "settingsScope"];

    function apply(ctx) {
      if (typeof document === "undefined") return;

      const scope = ctx.settingsScope.bind({ namespace: NAMESPACE });

      // A single <style> element owned by this plugin's fiber; re-written in
      // place on every change and removed on teardown.
      let styleEl = null;
      ctx.effect(() => {
        const tag = document.createElement("style");
        tag.dataset.plugin = "dsh-dense-ui";
        tag.dataset.pluginCss = "dsh-dense-ui/styles";
        document.head.appendChild(tag);
        styleEl = tag;
        return () => {
          tag.remove();
          styleEl = null;
        };
      }, "dsh-dense-ui: stylesheet");

      // Apply a settings object to the DOM now (live preview).
      function applyToDom(raw) {
        const cfg = normalize(raw);
        if (styleEl) styleEl.textContent = buildCss(cfg);
        return cfg;
      }

      // The most recently applied normalized config (shared with the panel).
      let last = DEFAULTS;

      const refresh = () => {
        const snap = scope.getSnapshot();
        if (snap.status === "ready" && snap.value !== undefined) {
          last = applyToDom(snap.value);
        } else {
          last = applyToDom(DEFAULTS);
        }
      };
      ctx.effect(() => scope.subscribe(refresh), "dsh-dense-ui: settings subscription");
      refresh();

      // Write a single changed field. `settingsScope.set` serializes writes and
      // folds each accepted answer back into the mirror, so rapid slider drags
      // stay ordered and only the latest settles.
      function persistField(field, value) {
        scope.set(field, value).catch((error) => {
          console.error("dsh-dense-ui: persist failed for", field, error);
        });
      }

      // Register the settings panel into the settings navigation rail.
      ctx.slots.inject("settings.section", () => ctx.slots.register({
        name: "settings.section",
        id: "dense-ui",
        order: 50,
        label: () => "Dense UI"
      }, function Section() {
        const [cfg, setCfg] = react.useState(() => last);
        const onChange = (field, value) => {
          const next = { ...cfg, [field]: value };
          setCfg(next);
          last = applyToDom(next);
          persistField(field, value);
        };
        return h("div", { style: { padding: "16px 0" } },
          h(DenseUiPanel, { cfg, onChange }));
      }));
    }

    return { apply, inject };
  }
});
