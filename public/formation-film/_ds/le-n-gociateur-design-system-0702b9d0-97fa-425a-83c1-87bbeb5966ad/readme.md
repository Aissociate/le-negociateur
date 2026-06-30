# Le Négociateur — Design System

> Le Négociateur est un service qui aide les salariés à négocier leur rémunération. La cible : le salarié en poste depuis longtemps, déjà convaincu d'être sous-payé, mais qui ne sait pas comment s'y prendre. Le rôle de la marque est de taper là où ça fait mal — l'argent, la confiance — avec franchise et audace, **sans jamais être vulgaire**.

This project IS the design system. An automated compiler reads it and ships `styles.css` (tokens + fonts) plus a component bundle (`_ds_bundle.js`, generated — do not edit). Consumers link one file: `styles.css`.

**Sources:** built from scratch from the brand brief (no codebase or Figma was provided). Brand name, palette, type pairing, logo mark and all copy are original to this system. Fonts are Google Fonts (see Visual Foundations → Type).

---

## Brand idea

A negotiation coach in product form. The emotional arc: *you are underpaid → here is the number → here is exactly what to say → you walk out richer.* Confident, direct, a little provocative. Money is treated as a serious, earned subject — never a "get rich quick" gimmick.

Namespace for components in card/kit HTML: `window.LeNGociateurDesignSystem_0702b9`.

---

## CONTENT FUNDAMENTALS — how we write

- **Language:** French, throughout.
- **Address:** **tutoiement** ("tu", "tes leviers", "tu vaux plus"). Direct, peer-to-peer, like a sharp friend who happens to be an expert. Never the corporate "vous".
- **Tone:** franc, assuré, un peu provocateur. We name the discomfort out loud — *"Tu es sous-payé."* — then immediately offer control — *"On va corriger ça."*
- **The money is concrete and specific.** Always real figures, in euros, in mono: `+8 400 €/an`, `56 400 €`, `11% sous le marché`. Vague promises ("gagnez plus !") are banned. Specific stakes ("soit 42 000 € sur 5 ans") are the whole point.
- **Structure of a pitch:** stakes → number → method → action. Short sentences. Verbs of control: *corriger, défendre, récupérer, négocier, oser.*
- **Casing:** sentence case everywhere except eyebrow/kicker labels, which are UPPERCASE mono with wide tracking (`ÉTAPE 02 — BENCHMARK`).
- **What we say:** « Tu vaux ce que le marché paie. Pas un euro de moins. »
- **What we never say:** « Devenez riche facilement grâce à notre méthode secrète !! » — no hype, no exclamation spam, no false scarcity, no condescension.
- **Emoji:** not used in product copy. The only recurring glyph is a small **▲** (upward triangle) as a "ça monte" marker on figures and eyebrows. Inline check marks (`✓`) appear in lists.

---

## VISUAL FOUNDATIONS

### Color
The palette is premium and restrained: **black · white · gold**, with red kept strictly for alerts. Three working hues — ink, ochre-gold, and clean warm white — so the brand reads expensive, not loud.
- **Encre** (`--encre-*`) — warm near-black ink. The **primary action color** (buttons, switches, checkboxes) and the dark hero/sidebar surface (`--encre-950`). Also all body text. Neutral-warm, never pure grey.
- **Or** (`--or-500`) — **ochre / gold**, the signature accent and the wealth color. Used for *money and success*: gains, the target salary, eyebrows/kickers, accent CTAs, premium plans, the highlight on dark, focus rings, the hard-shadow accent. Restrained so it stays precious; never a full-bleed wash except the one gold CTA band.
- **Papier / Blanc** (`--papier-*`, `--white`) — warm white page (`#FCFBF8`) with pure-white cards. The light, premium frame.
- **Rouge** (`--rouge-*`) — **ALERTS ONLY.** Errors, danger, and the "manque à gagner" pain reveal (you're *losing* money). Never used decoratively, never as primary. If it's red, something is wrong or being lost.
- Rule of thumb: **black for action, white for space, gold for the prize — red only when something's wrong.** No green, no brights.

### Type
- **Display — Bricolage Grotesque** (700): headlines, hero, big statements. Tight tracking (`-0.03em`), near-1.0 line-height. Heavy and confident.
- **Text/UI — Archivo** (400–700): body, labels, buttons. Calm, legible, neutral.
- **Figures — Spline Sans Mono** (500/600): **all money and numbers** — salaries, %, deltas, eyebrow labels. This mono = the "financial/serious" motif and is the single most recognisable type decision in the system.
- Eyebrows/kickers: mono, 12px, UPPERCASE, `0.14em` tracking.
- Substitution note: all three are genuine Google Fonts loaded via `tokens/fonts.css`. No local binaries are shipped; if a consumer needs offline/self-hosted fonts, add the `.woff2` files and `@font-face` rules and tell us.

### Spacing & layout
- 4px base grid (`--space-1..32`). Generous section rhythm (`--section-y: 96px`).
- Containers: `--container-max: 1200px`, narrow `760px`.
- Layouts are confident and roomy; dark full-bleed bands (near-black `--encre-950`) alternate with cream sections to create rhythm.

### Backgrounds
- No photography by default; no gradients-as-decoration. Surfaces are flat: warm white, white cards, or solid near-black. The one bold "wash" allowed is a solid gold CTA band.
- Optional subtle `backdrop-filter: blur` on the sticky nav over cream.

### Corners, borders, cards
- Radii are **fairly tight** (4–16px) for assertiveness; only buttons and pills go fully round (`--radius-pill`).
- **Two signature card motifs:**
  1. **Outlined** — white surface, 2px ink border, **hard offset shadow** (`5px 5px 0` ink or gold). This is the "audace" motif; use for emphasis cards. On hover it lifts (translate -2px, deeper shadow).
  2. **Soft** — white, subtle multi-layer elevation (`--shadow-md`).
  Plus **dark** — solid near-black for stat/hero blocks, with gold figures.

### Shadows
- Soft elevation: `--shadow-sm/md/lg`.
- Hard offset: `--shadow-hard` (ink), `--shadow-hard-accent` / `--shadow-hard-gold` (gold) — the brand's most distinctive depth treatment.

### Motion
- Snappy and confident. Durations 120/200/320ms. Default easing `--ease-out` (ease-out-expo). A slight overshoot (`--ease-overshoot`) on toggles/knobs.
- **Hover:** primary (black) buttons lighten to `--encre-800`, accent (gold) to `--or-600`; cards deepen shadow / lift.
- **Press:** buttons translate down 1px (or, when `elevated`, slam into their hard shadow: `translate(3px,3px)` + shrunk shadow). Tactile, decisive.
- No infinite/decorative loops. Reduced-motion friendly (transitions only).

### Transparency & blur
- Used minimally: translucent cream on the sticky nav; `rgba(255,255,255,.14)` hairlines on dark surfaces. No glassmorphism.

---

## ICONOGRAPHY

- **System:** [Lucide](https://lucide.dev) — 2px stroke, rounded caps/joins. It matches the brand's clean-but-confident line. In the app shell, a few Lucide-style glyphs are hand-inlined as SVG (`AppShell.jsx`) at 2px stroke to avoid a runtime dependency; for new work, link Lucide from CDN (`https://unpkg.com/lucide@latest`) or inline the same 2px-stroke paths. **Flagged substitution:** Lucide is a chosen stand-in (no proprietary icon set was provided) — swap if the brand later adopts a custom set.
- **Stroke, not fill.** Icons are line icons; avoid filled/duotone.
- **Active state:** the icon stroke goes gold and the nav item lifts to a darker ink panel on the near-black sidebar.
- **Brand glyph:** the upward triangle **▲** marks rising figures; check marks `✓` in feature lists. No emoji in product UI.
- **Logo:** `assets/logo-mark.svg` (ascending bars on near-black, culminating gold = a rising salary), `assets/logo-mark-accent.svg` (gold tile for dark surfaces), `assets/logo-wordmark.svg` (mark + Bricolage wordmark). The wordmark in HTML is best built as mark + live `Bricolage Grotesque` text (see `guidelines/brand-logo.card.html`).

---

## INDEX — what's in this project

**Root**
- `styles.css` — entry point (imports only). Consumers link this.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `effects.css`, `motion.css`.
- `assets/` — logo mark / accent mark / wordmark SVGs.
- `SKILL.md` — Agent-Skill manifest for downloadable use.

**Components** (`components/`, namespace `LeNGociateurDesignSystem_0702b9`)
- `forms/` — `Button`, `Input`, `Checkbox`, `Switch`
- `data/` — `Badge`, `Stat` (money figure), `ProgressMeter`
- `layout/` — `Card`, `Callout`, `Avatar`
- Each has `.jsx` + `.d.ts` + `.prompt.md`; one `@dsCard` per directory.

**UI kits** (`ui_kits/`)
- `site/` — marketing landing (hero + manque-à-gagner calculator, method, pricing, testimonial).
- `app/` — product app (dashboard, benchmark, négociation script). Click the sidebar to navigate.

**Foundation cards** (`guidelines/`) — specimen cards for the Design System tab: Colors, Type, Spacing, Brand.

**Starting points:** `Button`, `Stat`, `Card` (components); marketing landing + app dashboard (screens).
