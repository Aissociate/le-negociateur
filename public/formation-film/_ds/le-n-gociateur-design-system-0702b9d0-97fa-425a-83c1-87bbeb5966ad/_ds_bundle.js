/* @ds-bundle: {"format":3,"namespace":"LeNGociateurDesignSystem_0702b9","components":[{"name":"Badge","sourcePath":"components/data/Badge.jsx"},{"name":"ProgressMeter","sourcePath":"components/data/ProgressMeter.jsx"},{"name":"Stat","sourcePath":"components/data/Stat.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Avatar","sourcePath":"components/layout/Avatar.jsx"},{"name":"Callout","sourcePath":"components/layout/Callout.jsx"},{"name":"Card","sourcePath":"components/layout/Card.jsx"}],"sourceHashes":{"components/data/Badge.jsx":"8f539426f6fe","components/data/ProgressMeter.jsx":"767f60e62b94","components/data/Stat.jsx":"349758026914","components/forms/Button.jsx":"02cc4c789410","components/forms/Checkbox.jsx":"6b36cc9f2c31","components/forms/Input.jsx":"55d586517fd7","components/forms/Switch.jsx":"09f608717573","components/layout/Avatar.jsx":"176515b70f4f","components/layout/Callout.jsx":"063d692788ae","components/layout/Card.jsx":"97a1c9e80a04","ui_kits/app/AppShell.jsx":"d1dfde3443e0","ui_kits/app/Screens.jsx":"4d72c1ee7147","ui_kits/site/Hero.jsx":"aa2cab25364c","ui_kits/site/Sections.jsx":"88bf3f06fb9b","ui_kits/site/SiteNav.jsx":"e7e9cb857bdf"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.LeNGociateurDesignSystem_0702b9 = window.LeNGociateurDesignSystem_0702b9 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/data/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  primary: {
    bg: "var(--encre-100)",
    fg: "var(--encre-900)"
  },
  gold: {
    bg: "var(--or-200)",
    fg: "var(--or-800)"
  },
  danger: {
    bg: "var(--rouge-100)",
    fg: "var(--rouge-600)"
  },
  neutral: {
    bg: "var(--encre-100)",
    fg: "var(--encre-600)"
  },
  dark: {
    bg: "var(--encre-950)",
    fg: "var(--or-400)"
  }
};

/**
 * Badge — small status/label pill. Mono text, uppercase.
 */
function Badge({
  children,
  tone = "primary",
  dot = false,
  solid = false,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.primary;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      borderRadius: "var(--radius-pill)",
      background: t.bg,
      color: t.fg,
      font: "var(--fw-semibold) 11px/1 var(--font-mono)",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      ...style
    }
  }, rest), dot ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: "currentColor"
    }
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Badge.jsx", error: String((e && e.message) || e) }); }

// components/data/ProgressMeter.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ProgressMeter — labelled progress / confidence bar.
 * Used for the negotiation "readiness" motif.
 */
function ProgressMeter({
  value = 0,
  max = 100,
  label,
  valueLabel,
  tone = "primary",
  onDark = false,
  style,
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  const fill = tone === "gold" ? "var(--or-500)" : tone === "danger" ? "var(--rouge-500)" : "var(--or-500)";
  const trackBg = onDark ? "rgba(255,255,255,0.14)" : "var(--encre-100)";
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      ...style
    }
  }, rest), label || valueLabel ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline"
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-semibold) 13px/1.2 var(--font-text)",
      color: onDark ? "var(--papier-100)" : "var(--encre-800)"
    }
  }, label) : /*#__PURE__*/React.createElement("span", null), valueLabel ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-semibold) 13px/1 var(--font-mono)",
      color: onDark ? "var(--or-400)" : "var(--or-600)"
    }
  }, valueLabel) : null) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 10,
      borderRadius: 999,
      background: trackBg,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${pct}%`,
      height: "100%",
      borderRadius: 999,
      background: fill,
      transition: "width var(--dur-slow) var(--ease-out)"
    }
  })));
}
Object.assign(__ds_scope, { ProgressMeter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ProgressMeter.jsx", error: String((e && e.message) || e) }); }

// components/data/Stat.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Stat — a monetary / numeric figure with label and optional delta.
 * Figures are always set in mono (the money motif).
 */
function Stat({
  value,
  label,
  delta,
  deltaDir = "up",
  onDark = false,
  size = "md",
  style,
  ...rest
}) {
  const sizes = {
    sm: 24,
    md: 38,
    lg: 56
  };
  const fs = sizes[size] || sizes.md;
  const deltaColor = deltaDir === "down" ? "var(--rouge-500)" : onDark ? "var(--or-400)" : "var(--or-600)";
  const arrow = deltaDir === "down" ? "▼" : "▲";
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 4,
      ...style
    }
  }, rest), label ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-medium) 11px/1.2 var(--font-mono)",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: onDark ? "var(--papier-300)" : "var(--encre-500)"
    }
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--fw-semibold) ${fs}px/1 var(--font-mono)`,
      letterSpacing: "-0.02em",
      color: onDark ? "var(--papier-100)" : "var(--encre-950)"
    }
  }, value), delta ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-semibold) 14px/1 var(--font-mono)",
      color: deltaColor
    }
  }, arrow, " ", delta) : null));
}
Object.assign(__ds_scope, { Stat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Stat.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    font: "13px",
    pad: "8px 14px",
    h: 36,
    gap: 7
  },
  md: {
    font: "15px",
    pad: "11px 20px",
    h: 44,
    gap: 8
  },
  lg: {
    font: "17px",
    pad: "15px 28px",
    h: 54,
    gap: 10
  }
};
const VARIANTS = {
  primary: {
    bg: "var(--encre-950)",
    bgHover: "var(--encre-800)",
    fg: "var(--papier-100)",
    border: "transparent"
  },
  accent: {
    bg: "var(--or-500)",
    bgHover: "var(--or-600)",
    fg: "var(--encre-950)",
    border: "transparent"
  },
  secondary: {
    bg: "transparent",
    bgHover: "var(--papier-500)",
    fg: "var(--encre-950)",
    border: "var(--encre-950)"
  },
  ghost: {
    bg: "transparent",
    bgHover: "var(--papier-500)",
    fg: "var(--encre-800)",
    border: "transparent"
  },
  danger: {
    bg: "var(--rouge-500)",
    bgHover: "var(--rouge-600)",
    fg: "var(--white)",
    border: "transparent"
  }
};

/**
 * Button — the primary call to action. Confident, snappy, slightly rounded.
 */
function Button({
  children,
  variant = "primary",
  size = "md",
  iconLeft = null,
  iconRight = null,
  block = false,
  elevated = false,
  disabled = false,
  type = "button",
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const css = {
    display: block ? "flex" : "inline-flex",
    width: block ? "100%" : "auto",
    alignItems: "center",
    justifyContent: "center",
    gap: s.gap,
    minHeight: s.h,
    padding: s.pad,
    font: `var(--fw-semibold) ${s.font}/1 var(--font-text)`,
    letterSpacing: "0.01em",
    color: v.fg,
    background: disabled ? "var(--encre-200)" : hover ? v.bgHover : v.bg,
    border: `2px solid ${disabled ? "transparent" : v.border}`,
    borderRadius: "var(--radius-pill)",
    boxShadow: elevated && !disabled ? press ? "2px 2px 0 var(--encre-950)" : "var(--shadow-hard)" : "none",
    cursor: disabled ? "not-allowed" : "pointer",
    transform: press && !disabled ? elevated ? "translate(3px,3px)" : "translateY(1px)" : "none",
    transition: "background var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)",
    whiteSpace: "nowrap",
    opacity: disabled ? 0.85 : 1,
    ...style
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: css
  }, rest), iconLeft ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex"
    }
  }, iconLeft) : null, children, iconRight ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex"
    }
  }, iconRight) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Checkbox — square check with optional label. Checked = émeraude.
 */
function Checkbox({
  checked = false,
  onChange,
  disabled = false,
  label,
  id,
  ...rest
}) {
  const fid = id || React.useId();
  const box = {
    width: 20,
    height: 20,
    flex: "0 0 auto",
    borderRadius: "var(--radius-xs)",
    background: checked ? "var(--encre-950)" : "var(--white)",
    border: `2px solid ${checked ? "var(--encre-950)" : "var(--encre-300)"}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all var(--dur-fast) var(--ease-out)",
    cursor: disabled ? "not-allowed" : "pointer"
  };
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: fid,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1
    }
  }, /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    role: "checkbox",
    "aria-checked": checked,
    disabled: disabled,
    id: fid,
    onClick: () => !disabled && onChange && onChange(!checked),
    style: box
  }, rest), checked ? /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2.5 6.2l2.3 2.3 4.7-5",
    stroke: "white",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })) : null), label ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-regular) 14px/1.3 var(--font-text)",
      color: "var(--encre-800)"
    }
  }, label) : null);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Input — text field with optional label, prefix/suffix, and error state.
 */
function Input({
  label,
  hint,
  error,
  prefix = null,
  suffix = null,
  size = "md",
  id,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const fid = id || React.useId();
  const pad = size === "lg" ? "14px 16px" : "11px 14px";
  const fs = size === "lg" ? "16px" : "15px";
  const borderColor = error ? "var(--rouge-500)" : focus ? "var(--or-600)" : "var(--encre-200)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("label", {
    htmlFor: fid,
    style: {
      font: "var(--fw-semibold) 13px/1.2 var(--font-text)",
      color: "var(--encre-800)"
    }
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: pad,
      background: "var(--white)",
      border: `1.5px solid ${borderColor}`,
      borderRadius: "var(--radius-sm)",
      boxShadow: focus ? "var(--ring)" : "none",
      transition: "border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)"
    }
  }, prefix ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--encre-400)",
      display: "inline-flex"
    }
  }, prefix) : null, /*#__PURE__*/React.createElement("input", _extends({
    id: fid,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      border: "none",
      outline: "none",
      background: "transparent",
      font: `var(--fw-regular) ${fs}/1.3 var(--font-text)`,
      color: "var(--encre-950)",
      width: "100%",
      minWidth: 0
    }
  }, rest)), suffix ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--encre-400)",
      display: "inline-flex",
      font: "var(--fw-medium) 13px/1 var(--font-mono)"
    }
  }, suffix) : null), error ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-medium) 12px/1.3 var(--font-text)",
      color: "var(--rouge-600)"
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-regular) 12px/1.3 var(--font-text)",
      color: "var(--encre-500)"
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Switch — on/off toggle. On = émeraude.
 */
function Switch({
  checked = false,
  onChange,
  disabled = false,
  label,
  id,
  ...rest
}) {
  const fid = id || React.useId();
  const track = {
    width: 44,
    height: 26,
    borderRadius: 999,
    position: "relative",
    flex: "0 0 auto",
    background: checked ? "var(--encre-950)" : "var(--encre-300)",
    transition: "background var(--dur-base) var(--ease-out)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    border: "none",
    padding: 0
  };
  const knob = {
    position: "absolute",
    top: 3,
    left: checked ? 21 : 3,
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "var(--white)",
    boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
    transition: "left var(--dur-base) var(--ease-overshoot)"
  };
  const btn = /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    role: "switch",
    "aria-checked": checked,
    disabled: disabled,
    id: fid,
    onClick: () => !disabled && onChange && onChange(!checked),
    style: track
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: knob
  }));
  if (!label) return btn;
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: fid,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      cursor: disabled ? "not-allowed" : "pointer"
    }
  }, btn, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-medium) 14px/1.2 var(--font-text)",
      color: "var(--encre-800)"
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/layout/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Avatar — circular user image or initials.
 */
function Avatar({
  src,
  name = "",
  size = 40,
  tone = "primary",
  style,
  ...rest
}) {
  const tones = {
    primary: {
      bg: "var(--encre-950)",
      fg: "var(--papier-100)"
    },
    gold: {
      bg: "var(--or-500)",
      fg: "var(--encre-950)"
    },
    dark: {
      bg: "var(--encre-900)",
      fg: "var(--or-400)"
    }
  };
  const t = tones[tone] || tones.primary;
  const initials = name.split(" ").map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: size,
      height: size,
      borderRadius: "50%",
      flex: "0 0 auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      background: t.bg,
      color: t.fg,
      font: `var(--fw-semibold) ${Math.round(size * 0.4)}px/1 var(--font-text)`,
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }) : initials);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/layout/Callout.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  info: {
    bg: "var(--encre-100)",
    border: "var(--encre-200)",
    fg: "var(--encre-800)",
    accent: "var(--encre-700)"
  },
  success: {
    bg: "var(--or-200)",
    border: "var(--or-300)",
    fg: "var(--or-800)",
    accent: "var(--or-600)"
  },
  warning: {
    bg: "var(--or-200)",
    border: "var(--or-400)",
    fg: "var(--or-800)",
    accent: "var(--or-500)"
  },
  danger: {
    bg: "var(--rouge-100)",
    border: "var(--rouge-200)",
    fg: "var(--rouge-700)",
    accent: "var(--rouge-500)"
  }
};

/**
 * Callout — inline contextual message with a left accent bar.
 */
function Callout({
  children,
  title,
  tone = "info",
  icon = null,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.info;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      gap: 12,
      padding: "14px 16px",
      background: t.bg,
      border: `1px solid ${t.border}`,
      borderLeft: `4px solid ${t.accent}`,
      borderRadius: "var(--radius-sm)",
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: t.accent,
      flex: "0 0 auto",
      display: "inline-flex",
      marginTop: 1
    }
  }, icon) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, title ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-bold) 14px/1.3 var(--font-text)",
      color: t.fg
    }
  }, title) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-regular) 14px/1.45 var(--font-text)",
      color: t.fg
    }
  }, children)));
}
Object.assign(__ds_scope, { Callout });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Callout.jsx", error: String((e && e.message) || e) }); }

// components/layout/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Card — content container. Two signature motifs:
 *  - "soft"    : white surface, subtle elevation.
 *  - "outlined": ink border + hard offset shadow (audace).
 *  - "dark"    : émeraude surface for emphasis blocks.
 */
function Card({
  children,
  variant = "soft",
  padding = 24,
  interactive = false,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const base = {
    soft: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-subtle)",
      boxShadow: hover && interactive ? "var(--shadow-lg)" : "var(--shadow-md)"
    },
    outlined: {
      background: "var(--surface-card)",
      border: "2px solid var(--encre-950)",
      boxShadow: hover && interactive ? "7px 7px 0 var(--encre-950)" : "var(--shadow-hard)"
    },
    dark: {
      background: "var(--surface-dark)",
      border: "1px solid transparent",
      boxShadow: "none",
      color: "var(--papier-100)"
    }
  }[variant] || {};
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      borderRadius: "var(--radius-lg)",
      padding,
      transition: "box-shadow var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out)",
      transform: hover && interactive && variant === "outlined" ? "translate(-2px,-2px)" : "none",
      cursor: interactive ? "pointer" : "default",
      ...base,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Card.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/AppShell.jsx
try { (() => {
/* App shell: left sidebar + top bar. Loaded via babel; uses global React. */
function Icon({
  d,
  size = 18,
  stroke = "currentColor"
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: stroke,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, d);
}
const ICONS = {
  dashboard: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 13h8V3H3zM13 21h8V3h-8zM3 21h8v-6H3z"
  })),
  benchmark: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 3v18h18"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "7",
    y: "12",
    width: "3",
    height: "6"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "12",
    y: "8",
    width: "3",
    height: "10"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "17",
    y: "4",
    width: "3",
    height: "14"
  })),
  playbook: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
  })),
  bell: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10.3 21a1.94 1.94 0 0 0 3.4 0"
  }))
};
function AppSidebar({
  view,
  setView,
  DS
}) {
  const items = [{
    id: "dashboard",
    label: "Tableau de bord",
    icon: ICONS.dashboard
  }, {
    id: "benchmark",
    label: "Benchmark",
    icon: ICONS.benchmark
  }, {
    id: "playbook",
    label: "Mon script",
    icon: ICONS.playbook
  }];
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 248,
      flex: "0 0 248px",
      background: "var(--encre-950)",
      color: "var(--papier-300)",
      display: "flex",
      flexDirection: "column",
      padding: "22px 16px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "0 8px 22px"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark-accent.svg",
    width: "30",
    height: "30",
    alt: ""
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-bold) 17px/1 var(--font-display)",
      color: "var(--papier-100)"
    }
  }, "Le N\xE9gociateur")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, items.map(it => {
    const active = view === it.id;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onClick: () => setView(it.id),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 12px",
        borderRadius: "var(--radius-sm)",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        background: active ? "var(--encre-800)" : "transparent",
        color: active ? "var(--papier-100)" : "var(--papier-300)",
        font: "var(--fw-semibold) 14px/1 var(--font-text)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      d: it.icon,
      stroke: active ? "var(--or-500)" : "var(--or-400)"
    }), it.label);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      background: "var(--encre-900)",
      borderRadius: "var(--radius-md)",
      padding: 16,
      border: "1px solid var(--border-on-dark)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow",
    style: {
      color: "var(--or-500)"
    }
  }, "\xC9tape suivante"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--fw-medium) 13px/1.4 var(--font-text)",
      color: "var(--papier-300)",
      margin: "8px 0 12px"
    }
  }, "R\xE9serve ton entretien et r\xE9p\xE8te ton script."), /*#__PURE__*/React.createElement(DS.Button, {
    variant: "accent",
    size: "sm",
    block: true
  }, "Je suis pr\xEAt")));
}
function AppTopbar({
  title,
  DS
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "18px 32px",
      borderBottom: "1px solid var(--border-subtle)",
      background: "var(--surface-page)"
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: "var(--fw-bold) 22px/1 var(--font-display)",
      letterSpacing: "-0.02em",
      color: "var(--encre-950)",
      margin: 0
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      alignItems: "center",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(DS.Badge, {
    tone: "danger",
    dot: true
  }, "Sous-pay\xE9 de 11%"), /*#__PURE__*/React.createElement("button", {
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--encre-600)",
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    d: ICONS.bell
  })), /*#__PURE__*/React.createElement(DS.Avatar, {
    name: "Camille Roche",
    size: 36
  })));
}
Object.assign(window, {
  AppSidebar,
  AppTopbar,
  AppIcon: Icon,
  APP_ICONS: ICONS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Screens.jsx
try { (() => {
/* App screens: Dashboard, Benchmark, Playbook. */
const fmtE = n => n.toLocaleString("fr-FR") + " €";
function Dashboard({
  DS,
  setView
}) {
  const {
    Card,
    Stat,
    ProgressMeter,
    Callout,
    Button,
    Badge
  } = DS;
  const steps = [{
    t: "Diagnostic complété",
    done: true
  }, {
    t: "Benchmark de marché validé",
    done: true
  }, {
    t: "Script d'entretien généré",
    done: true
  }, {
    t: "Entraînement aux objections",
    done: false
  }, {
    t: "Entretien réservé",
    done: false
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 32,
      display: "flex",
      flexDirection: "column",
      gap: 22
    }
  }, /*#__PURE__*/React.createElement(Card, {
    variant: "dark",
    padding: 28
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.2fr 1fr 1fr",
      gap: 28,
      alignItems: "center"
    },
    className: "app-statgrid"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow",
    style: {
      color: "var(--or-500)"
    }
  }, "Bonjour Camille"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--fw-bold) 28px/1.1 var(--font-display)",
      color: "var(--papier-100)",
      margin: "10px 0 0",
      letterSpacing: "-0.02em"
    }
  }, "Tu laisses ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--or-500)"
    }
  }, fmtE(6200)), " par an sur la table.")), /*#__PURE__*/React.createElement(Stat, {
    onDark: true,
    label: "Ton salaire",
    value: fmtE(48000),
    size: "md"
  }), /*#__PURE__*/React.createElement(Stat, {
    onDark: true,
    label: "Cible d\xE9fendable",
    value: fmtE(56400),
    delta: "+8 400 \u20AC",
    deltaDir: "up",
    size: "md"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.4fr 1fr",
      gap: 22
    },
    className: "app-2col"
  }, /*#__PURE__*/React.createElement(Card, {
    variant: "soft",
    padding: 24
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: "var(--fw-bold) 18px/1 var(--font-display)",
      color: "var(--encre-950)",
      margin: 0
    }
  }, "Ta pr\xE9paration"), /*#__PURE__*/React.createElement(Badge, {
    tone: "gold"
  }, "3 / 5")), /*#__PURE__*/React.createElement(ProgressMeter, {
    value: 60,
    valueLabel: "60%",
    tone: "gold",
    style: {
      marginBottom: 20
    }
  }), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      padding: 0,
      margin: 0,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, steps.map(s => /*#__PURE__*/React.createElement("li", {
    key: s.t,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      height: 22,
      borderRadius: "50%",
      flex: "0 0 auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: s.done ? "var(--or-600)" : "var(--encre-100)",
      color: "var(--white)",
      font: "700 12px/1 var(--font-text)"
    }
  }, s.done ? "✓" : ""), /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--fw-${s.done ? "medium" : "regular"}) 15px/1.3 var(--font-text)`,
      color: s.done ? "var(--encre-800)" : "var(--encre-500)"
    }
  }, s.t))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 22
    }
  }, /*#__PURE__*/React.createElement(Callout, {
    tone: "danger",
    title: "Tu es sous le march\xE9"
  }, "11% sous la m\xE9diane pour ton poste \xE0 ton anciennet\xE9 (7 ans)."), /*#__PURE__*/React.createElement(Card, {
    variant: "outlined",
    padding: 22,
    interactive: true,
    onClick: () => setView("playbook")
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow",
    style: {
      color: "var(--or-700)"
    }
  }, "Prochaine action"), /*#__PURE__*/React.createElement("h3", {
    style: {
      font: "var(--fw-bold) 19px/1.15 var(--font-display)",
      color: "var(--encre-950)",
      margin: "10px 0 14px"
    }
  }, "R\xE9p\xE8te ton script d'entretien"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm"
  }, "Ouvrir mon script \u2192")))));
}
function Benchmark({
  DS
}) {
  const {
    Card,
    Stat,
    Badge
  } = DS;
  // distribution buckets (k€)
  const bars = [{
    l: "42",
    h: 38
  }, {
    l: "46",
    h: 58
  }, {
    l: "48",
    h: 72,
    you: true
  }, {
    l: "52",
    h: 90
  }, {
    l: "56",
    h: 100,
    market: true
  }, {
    l: "60",
    h: 76
  }, {
    l: "64",
    h: 52
  }, {
    l: "70",
    h: 30
  }];
  const factors = [{
    t: "Ancienneté 7 ans",
    v: "+",
    d: "Au-dessus de la moyenne du poste"
  }, {
    t: "Région — Paris",
    v: "+",
    d: "Marché tendu, salaires élevés"
  }, {
    t: "Pas d'augmentation depuis 3 ans",
    v: "−",
    d: "Décrochage face au marché"
  }, {
    t: "Compétences rares (data)",
    v: "+",
    d: "Forte demande, levier réel"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 32,
      display: "flex",
      flexDirection: "column",
      gap: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 22
    },
    className: "app-statgrid"
  }, /*#__PURE__*/React.createElement(Card, {
    variant: "soft",
    padding: 22
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Ton salaire",
    value: fmtE(48000),
    size: "md"
  })), /*#__PURE__*/React.createElement(Card, {
    variant: "soft",
    padding: 22
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "M\xE9diane march\xE9",
    value: fmtE(56400),
    delta: "+8 400 \u20AC",
    deltaDir: "up",
    size: "md"
  })), /*#__PURE__*/React.createElement(Card, {
    variant: "soft",
    padding: 22
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Ton percentile",
    value: "34e",
    delta: "cible : 60e",
    deltaDir: "up",
    size: "md"
  }))), /*#__PURE__*/React.createElement(Card, {
    variant: "soft",
    padding: 26
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: "var(--fw-bold) 18px/1 var(--font-display)",
      color: "var(--encre-950)",
      margin: 0
    }
  }, "Distribution des salaires \u2014 ton poste"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-medium) 12px/1 var(--font-mono)",
      color: "var(--encre-500)"
    }
  }, "Data Engineer \xB7 5-8 ans \xB7 Paris")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 14,
      height: 180,
      padding: "0 4px"
    }
  }, bars.map((b, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8
    }
  }, b.you ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "600 10px/1 var(--font-mono)",
      color: "var(--rouge-600)"
    }
  }, "TOI") : b.market ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: "600 10px/1 var(--font-mono)",
      color: "var(--or-700)"
    }
  }, "CIBLE") : /*#__PURE__*/React.createElement("span", {
    style: {
      height: 10
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      height: b.h * 1.4,
      borderRadius: "6px 6px 0 0",
      background: b.you ? "var(--rouge-500)" : b.market ? "var(--or-500)" : "var(--encre-200)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "500 11px/1 var(--font-mono)",
      color: "var(--encre-500)"
    }
  }, b.l, "k"))))), /*#__PURE__*/React.createElement(Card, {
    variant: "soft",
    padding: 26
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: "var(--fw-bold) 18px/1 var(--font-display)",
      color: "var(--encre-950)",
      margin: "0 0 18px"
    }
  }, "Tes leviers de n\xE9gociation"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14
    },
    className: "app-2col"
  }, factors.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.t,
    style: {
      display: "flex",
      gap: 12,
      padding: 14,
      background: "var(--surface-page)",
      borderRadius: "var(--radius-sm)",
      border: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      flex: "0 0 auto",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: f.v === "+" ? "var(--or-200)" : "var(--rouge-100)",
      color: f.v === "+" ? "var(--or-700)" : "var(--rouge-600)",
      font: "700 16px/1 var(--font-mono)"
    }
  }, f.v), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--fw-semibold) 14px/1.2 var(--font-text)",
      color: "var(--encre-900)"
    }
  }, f.t), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--fw-regular) 13px/1.35 var(--font-text)",
      color: "var(--encre-500)",
      marginTop: 2
    }
  }, f.d)))))));
}
function Playbook({
  DS
}) {
  const {
    Card,
    Callout,
    Badge,
    Button
  } = DS;
  const script = [{
    phase: "Ouverture",
    line: "« Merci d'avoir pris ce temps. Je voulais faire le point sur ma rémunération au regard de ce que j'apporte et du marché. »"
  }, {
    phase: "Ancrage",
    line: "« Sur mon poste, à mon niveau d'ancienneté, la médiane de marché est à 56 400 €. Je suis aujourd'hui à 48 000 €. »"
  }, {
    phase: "Preuve",
    line: "« Cette année, j'ai livré le projet X qui a généré Y. J'ai aussi repris le périmètre de Z. »"
  }, {
    phase: "Demande",
    line: "« Je propose qu'on aligne mon salaire à 56 000 €, en cohérence avec le marché et ma contribution. »"
  }];
  const objections = [{
    q: "« Le budget est serré cette année. »",
    a: "« Je comprends. Construisons un plan sur 2 temps : un premier palier maintenant, le solde au prochain semestre. »"
  }, {
    q: "« Ce n'est pas le bon moment. »",
    a: "« Quel serait le bon moment, concrètement ? Fixons une date et les critères ensemble. »"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 32,
      display: "grid",
      gridTemplateColumns: "1.5fr 1fr",
      gap: 22,
      alignItems: "start"
    },
    className: "app-2col"
  }, /*#__PURE__*/React.createElement(Card, {
    variant: "soft",
    padding: 26
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "gold"
  }, "Script"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-medium) 12px/1 var(--font-mono)",
      color: "var(--encre-500)"
    }
  }, "~ 6 min \xB7 \xE0 r\xE9p\xE9ter \xE0 voix haute")), /*#__PURE__*/React.createElement("h3", {
    style: {
      font: "var(--fw-bold) 22px/1.1 var(--font-display)",
      color: "var(--encre-950)",
      margin: "8px 0 20px"
    }
  }, "Ton entretien, mot pour mot"), /*#__PURE__*/React.createElement("ol", {
    style: {
      listStyle: "none",
      padding: 0,
      margin: 0,
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, script.map((s, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: "flex",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-semibold) 13px/1 var(--font-mono)",
      color: "var(--or-700)",
      paddingTop: 4,
      flex: "0 0 auto",
      width: 64
    }
  }, s.phase), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--fw-regular) 15px/1.5 var(--font-text)",
      color: "var(--encre-800)",
      margin: 0,
      padding: "12px 16px",
      background: "var(--surface-page)",
      borderRadius: "var(--radius-sm)",
      borderLeft: "3px solid var(--or-400)",
      flex: 1
    }
  }, s.line)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    elevated: true
  }, "S'entra\xEEner avec le coach IA"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Callout, {
    tone: "info",
    title: "R\xE8gle d'or"
  }, "Annonce ton chiffre, puis tais-toi. Le premier qui parle apr\xE8s le chiffre perd du terrain."), /*#__PURE__*/React.createElement(Card, {
    variant: "outlined",
    padding: 22
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      font: "var(--fw-bold) 16px/1 var(--font-display)",
      color: "var(--encre-950)",
      margin: "0 0 14px"
    }
  }, "Objections fr\xE9quentes"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, objections.map((o, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--fw-semibold) 14px/1.4 var(--font-text)",
      color: "var(--encre-900)",
      margin: 0
    }
  }, o.q), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--fw-regular) 14px/1.45 var(--font-text)",
      color: "var(--encre-700)",
      margin: "4px 0 0"
    }
  }, o.a)))))));
}
Object.assign(window, {
  Dashboard,
  Benchmark,
  Playbook
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/site/Hero.jsx
try { (() => {
/* Hero with an interactive "manque à gagner" mini-calculator. */
function Hero({
  DS
}) {
  const {
    Button,
    Badge,
    Stat
  } = DS;
  const [salaire, setSalaire] = React.useState(48000);
  const [revealed, setRevealed] = React.useState(false);
  // Fake market model: market median ~ +17.5% over current.
  const marche = Math.round(salaire * 1.175 / 100) * 100;
  const ecart = marche - salaire;
  const fmt = n => n.toLocaleString("fr-FR") + " €";
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--surface-dark)",
      color: "var(--papier-100)",
      overflow: "hidden",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      padding: "84px 32px 92px",
      display: "grid",
      gridTemplateColumns: "1.05fr 0.95fr",
      gap: 56,
      alignItems: "center"
    },
    className: "hero-grid"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Badge, {
    tone: "dark",
    dot: true
  }, "\u25B2 +8 400 \u20AC d'augmentation moyenne"), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: "var(--fw-bold) 64px/0.98 var(--font-display)",
      letterSpacing: "-0.03em",
      margin: "20px 0 0",
      color: "var(--papier-100)"
    }
  }, "Tu es sous-pay\xE9.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--or-500)"
    }
  }, "On va corriger \xE7a.")), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--fw-regular) 19px/1.55 var(--font-text)",
      color: "var(--papier-300)",
      margin: "22px 0 0",
      maxWidth: "46ch"
    }
  }, "Le chiffre de march\xE9, les arguments et le script mot pour mot. Tu entres pr\xE9par\xE9 \xE0 ton entretien, tu sors augment\xE9."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      marginTop: 32,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    size: "lg",
    elevated: true
  }, "Lancer mon diagnostic gratuit"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "lg",
    style: {
      color: "var(--papier-100)"
    }
  }, "Voir la m\xE9thode")), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--fw-medium) 13px/1 var(--font-mono)",
      color: "var(--or-400)",
      marginTop: 22,
      letterSpacing: "0.04em"
    }
  }, "+12 000 salari\xE9s accompagn\xE9s \xB7 sans CB \xB7 4 min")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--white)",
      color: "var(--encre-900)",
      borderRadius: "var(--radius-xl)",
      padding: 28,
      boxShadow: "var(--shadow-lg)",
      border: "2px solid var(--encre-950)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow",
    style: {
      color: "var(--or-700)"
    }
  }, "Calcule ton manque \xE0 gagner"), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      font: "var(--fw-semibold) 14px/1 var(--font-text)",
      color: "var(--encre-700)",
      margin: "18px 0 10px"
    }
  }, "Ton salaire brut annuel"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-semibold) 34px/1 var(--font-mono)",
      color: "var(--encre-950)"
    }
  }, fmt(salaire))), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "28000",
    max: "120000",
    step: "1000",
    value: salaire,
    onChange: e => {
      setSalaire(+e.target.value);
      setRevealed(false);
    },
    style: {
      width: "100%",
      accentColor: "var(--or-600)",
      marginTop: 14
    }
  }), !revealed ? /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    block: true,
    size: "md",
    style: {
      marginTop: 18
    },
    onClick: () => setRevealed(true)
  }, "R\xE9v\xE9ler l'\xE9cart de march\xE9") : /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      padding: 18,
      background: "var(--rouge-100)",
      border: "1px solid var(--rouge-200)",
      borderRadius: "var(--radius-md)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "March\xE9 m\xE9dian",
    value: fmt(marche),
    size: "sm"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Ton manque / an",
    value: fmt(ecart),
    delta: "\xE0 r\xE9cup\xE9rer",
    deltaDir: "up",
    size: "sm"
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--fw-medium) 13px/1.4 var(--font-text)",
      color: "var(--rouge-700)",
      margin: "12px 0 0"
    }
  }, "Soit ", /*#__PURE__*/React.createElement("strong", null, fmt(ecart * 5)), " sur 5 ans si tu ne n\xE9gocies pas.")))));
}
window.Hero = Hero;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/site/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/site/Sections.jsx
try { (() => {
/* Remaining marketing sections: proof, method, pricing, testimonial, CTA, footer. */
function Proof() {
  const items = ["Tech", "Conseil", "Industrie", "Retail", "Santé", "Finance"];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--encre-950)",
      borderTop: "1px solid var(--border-on-dark)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      padding: "18px 32px",
      display: "flex",
      alignItems: "center",
      gap: 28,
      flexWrap: "wrap",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow",
    style: {
      color: "var(--or-400)"
    }
  }, "Ils ont n\xE9goci\xE9 dans"), items.map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      font: "var(--fw-semibold) 16px/1 var(--font-display)",
      color: "var(--papier-300)",
      opacity: 0.8
    }
  }, i))));
}
function Method({
  DS
}) {
  const {
    Card,
    Badge
  } = DS;
  const steps = [{
    n: "01",
    t: "Diagnostic",
    d: "On compare ta rémunération au marché réel pour ton poste, ta région et ton ancienneté. Tu vois l'écart, chiffré."
  }, {
    n: "02",
    t: "Stratégie",
    d: "Tes arguments, tes preuves de valeur, ton chiffre cible et ton plancher. La fourchette que tu défends."
  }, {
    n: "03",
    t: "Script",
    d: "Le déroulé mot pour mot de l'entretien, les objections du manager et tes réponses. Tu t'entraînes, tu y vas."
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      padding: "96px 32px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 640
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow",
    style: {
      color: "var(--or-700)"
    }
  }, "La m\xE9thode"), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: "var(--fw-bold) 42px/1.05 var(--font-display)",
      letterSpacing: "-0.025em",
      color: "var(--encre-950)",
      margin: "14px 0 0"
    }
  }, "Trois \xE9tapes. Z\xE9ro improvisation."), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--fw-regular) 18px/1.55 var(--font-text)",
      color: "var(--encre-700)",
      margin: "14px 0 0"
    }
  }, "La plupart des gens ratent leur n\xE9gociation parce qu'ils y vont au feeling. Toi, tu y vas avec un plan.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 22,
      marginTop: 44
    },
    className: "method-grid"
  }, steps.map(s => /*#__PURE__*/React.createElement(Card, {
    key: s.n,
    variant: "outlined",
    interactive: true
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-semibold) 13px/1 var(--font-mono)",
      color: "var(--or-700)",
      letterSpacing: "0.1em"
    }
  }, "\xC9TAPE ", s.n), /*#__PURE__*/React.createElement("h3", {
    style: {
      font: "var(--fw-bold) 24px/1.1 var(--font-display)",
      color: "var(--encre-950)",
      margin: "12px 0 8px"
    }
  }, s.t), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--fw-regular) 15px/1.55 var(--font-text)",
      color: "var(--encre-700)",
      margin: 0
    }
  }, s.d)))));
}
function Pricing({
  DS
}) {
  const {
    Card,
    Button,
    Badge
  } = DS;
  const plans = [{
    name: "Diagnostic",
    price: "Gratuit",
    tag: null,
    feats: ["Écart de marché chiffré", "Estimation du manque à gagner", "1 argument clé"],
    cta: "Commencer",
    variant: "secondary",
    dark: false
  }, {
    name: "Négociation",
    price: "89 €",
    tag: "Le plus choisi",
    feats: ["Tout le Diagnostic", "Stratégie + fourchette cible", "Script complet d'entretien", "Simulateur d'objections", "Relances & email type"],
    cta: "Préparer mon entretien",
    variant: "accent",
    dark: true
  }, {
    name: "Accompagné",
    price: "290 €",
    tag: null,
    feats: ["Tout Négociation", "2 sessions coach 1:1", "Relecture de ton dossier", "Suivi jusqu'au résultat"],
    cta: "Être accompagné",
    variant: "primary",
    dark: false
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--surface-page-alt)",
      borderTop: "1px solid var(--border-subtle)",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      padding: "92px 32px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      maxWidth: 600,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow",
    style: {
      color: "var(--or-700)"
    }
  }, "Tarifs"), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: "var(--fw-bold) 42px/1.05 var(--font-display)",
      letterSpacing: "-0.025em",
      color: "var(--encre-950)",
      margin: "14px 0 0"
    }
  }, "Le prix d'un d\xEEner. Le retour d'une vie."), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--fw-regular) 17px/1.5 var(--font-text)",
      color: "var(--encre-700)",
      margin: "12px 0 0"
    }
  }, "Une augmentation de 8 400 \u20AC/an, \xE7a se rentabilise en quelques heures.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 22,
      marginTop: 48,
      alignItems: "start"
    },
    className: "pricing-grid"
  }, plans.map(p => /*#__PURE__*/React.createElement(Card, {
    key: p.name,
    variant: p.dark ? "dark" : "soft",
    padding: 28,
    style: p.dark ? {
      transform: "scale(1.03)",
      border: "2px solid var(--or-500)"
    } : {}
  }, p.tag ? /*#__PURE__*/React.createElement(Badge, {
    tone: "gold",
    style: {
      marginBottom: 14
    }
  }, p.tag) : null, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: "var(--fw-bold) 22px/1 var(--font-display)",
      color: p.dark ? "var(--papier-100)" : "var(--encre-950)",
      margin: "0 0 8px"
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--fw-semibold) 40px/1 var(--font-mono)",
      color: p.dark ? "var(--or-500)" : "var(--encre-950)",
      letterSpacing: "-0.02em"
    }
  }, p.price), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      padding: 0,
      margin: "20px 0 24px",
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, p.feats.map(f => /*#__PURE__*/React.createElement("li", {
    key: f,
    style: {
      display: "flex",
      gap: 9,
      font: "var(--fw-regular) 14px/1.4 var(--font-text)",
      color: p.dark ? "var(--papier-300)" : "var(--encre-700)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: p.dark ? "var(--or-500)" : "var(--or-600)",
      fontWeight: 700
    }
  }, "\u2713"), f))), /*#__PURE__*/React.createElement(Button, {
    variant: p.variant,
    block: true,
    elevated: p.dark
  }, p.cta))))));
}
function Testimonial({
  DS
}) {
  const {
    Avatar,
    Stat
  } = DS;
  return /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: "var(--container-narrow)",
      margin: "0 auto",
      padding: "96px 32px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow",
    style: {
      color: "var(--or-700)"
    }
  }, "R\xE9sultat"), /*#__PURE__*/React.createElement("blockquote", {
    style: {
      font: "var(--fw-medium) 32px/1.25 var(--font-display)",
      letterSpacing: "-0.02em",
      color: "var(--encre-950)",
      margin: "18px 0 0"
    }
  }, "\xAB Sept ans sans rien oser demander. En un entretien pr\xE9par\xE9, j'ai obtenu ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--or-700)"
    }
  }, "+9 200 \u20AC"), ". Le script a tout chang\xE9. \xBB"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Sofia Lemaire",
    size: 48
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--fw-semibold) 15px/1.2 var(--font-text)",
      color: "var(--encre-950)"
    }
  }, "Sofia Lemaire"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--fw-regular) 13px/1.2 var(--font-text)",
      color: "var(--encre-500)"
    }
  }, "Cheffe de projet \xB7 Lyon"))));
}
function FinalCTA({
  DS
}) {
  const {
    Button
  } = DS;
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--or-500)",
      color: "var(--encre-950)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      padding: "72px 32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 32,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: "var(--fw-bold) 40px/1.02 var(--font-display)",
      letterSpacing: "-0.025em",
      margin: 0,
      maxWidth: "18ch"
    }
  }, "Ton prochain entretien peut valoir 8 400 \u20AC."), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    elevated: true,
    style: {
      background: "var(--encre-950)"
    }
  }, "Lancer mon diagnostic")));
}
function SiteFooter() {
  const cols = {
    "Produit": ["Méthode", "Tarifs", "Diagnostic", "Simulateur"],
    "Ressources": ["Guide de négociation", "Grilles de salaire", "Blog", "FAQ"],
    "Société": ["À propos", "Contact", "Confidentialité", "CGU"]
  };
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--encre-950)",
      color: "var(--papier-300)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      padding: "56px 32px",
      display: "grid",
      gridTemplateColumns: "1.4fr repeat(3,1fr)",
      gap: 32
    },
    className: "footer-grid"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark-accent.svg",
    width: "32",
    height: "32",
    alt: ""
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-bold) 18px/1 var(--font-display)",
      color: "var(--papier-100)"
    }
  }, "Le N\xE9gociateur")), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--fw-regular) 14px/1.5 var(--font-text)",
      color: "var(--or-400)",
      margin: "14px 0 0",
      maxWidth: "30ch"
    }
  }, "Tu vaux ce que le march\xE9 paie. Pas un euro de moins.")), Object.entries(cols).map(([h, links]) => /*#__PURE__*/React.createElement("div", {
    key: h
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow",
    style: {
      color: "var(--or-500)",
      marginBottom: 14
    }
  }, h), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      padding: 0,
      margin: 0,
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, links.map(l => /*#__PURE__*/React.createElement("li", {
    key: l
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      font: "var(--fw-regular) 14px/1 var(--font-text)",
      color: "var(--papier-300)",
      textDecoration: "none"
    }
  }, l))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid var(--border-on-dark)",
      padding: "20px 32px",
      textAlign: "center",
      font: "var(--fw-regular) 13px/1 var(--font-mono)",
      color: "var(--or-500)"
    }
  }, "\xA9 2026 Le N\xE9gociateur \u2014 Fait avec audace \xE0 Paris"));
}
Object.assign(window, {
  Proof,
  Method,
  Pricing,
  Testimonial,
  FinalCTA,
  SiteFooter
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/site/Sections.jsx", error: String((e && e.message) || e) }); }

// ui_kits/site/SiteNav.jsx
try { (() => {
/* Loaded via <script type="text/babel"> — uses global React + window DS namespace. */
function SiteNav({
  Button
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 20,
      background: "rgba(250,247,239,0.86)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      padding: "14px 32px",
      display: "flex",
      alignItems: "center",
      gap: 28
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11,
      textDecoration: "none"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark.svg",
    width: "34",
    height: "34",
    alt: ""
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-bold) 19px/1 var(--font-display)",
      letterSpacing: "-0.02em",
      color: "var(--encre-950)"
    }
  }, "Le N\xE9gociateur")), /*#__PURE__*/React.createElement("nav", {
    className: "site-navlinks",
    style: {
      display: "flex",
      gap: 22,
      marginLeft: 18
    }
  }, ["Méthode", "Tarifs", "Résultats", "Ressources"].map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      font: "var(--fw-medium) 15px/1 var(--font-text)",
      color: "var(--encre-700)",
      textDecoration: "none"
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 12,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      font: "var(--fw-semibold) 15px/1 var(--font-text)",
      color: "var(--encre-900)",
      textDecoration: "none"
    }
  }, "Connexion"), /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    size: "sm",
    elevated: true
  }, "Mon diagnostic"))));
}
window.SiteNav = SiteNav;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/site/SiteNav.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.ProgressMeter = __ds_scope.ProgressMeter;

__ds_ns.Stat = __ds_scope.Stat;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Callout = __ds_scope.Callout;

__ds_ns.Card = __ds_scope.Card;

})();
