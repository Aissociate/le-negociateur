// Le Négociateur — scènes de la vidéo (arc: douleur → chiffre → méthode → gain → CTA)
// Charge animations.jsx avant ce fichier. Expose les scènes sur window.

const { useTime, useTimeline, Sprite, useSprite, Easing, interpolate, animate, clamp } = window;

// ── Palette + fonts (tokens du design system) ───────────────────────────────
const C = {
  ink:       'var(--encre-950)',
  ink900:    'var(--encre-900)',
  ink800:    'var(--encre-800)',
  ink700:    'var(--encre-700)',
  gold:      'var(--or-500)',
  gold600:   'var(--or-600)',
  gold400:   'var(--or-400)',
  gold300:   'var(--or-300)',
  gold100:   'var(--or-100)',
  cream:     'var(--papier-100)',
  cream300:  'var(--papier-300)',
  white:     '#FFFFFF',
  red:       'var(--rouge-500)',
  red600:    'var(--rouge-600)',
  red100:    'var(--rouge-100)',
  onDark:    'var(--papier-100)',
  onDarkMut: 'var(--encre-300)',
  body:      'var(--encre-800)',
  muted:     'var(--encre-500)',
};
const F = {
  display: '"Bricolage Grotesque", system-ui, sans-serif',
  text:    '"Archivo", system-ui, sans-serif',
  mono:    '"Spline Sans Mono", ui-monospace, monospace',
};

const euro = (v) => Math.round(v).toLocaleString('fr-FR') + ' €';
const num  = (v) => Math.round(v).toLocaleString('fr-FR');

// ── Reveal: fade + slide in at `at`, optional fade out at `out` ─────────────
function Reveal({ at = 0, dur = 0.5, out = null, outDur = 0.4, y = 26, x = 0,
                  ease = Easing.easeOutExpo, children, style = {} }) {
  const t = useTime();
  let opacity = 0, ty = y, tx = x;
  if (t >= at) {
    const e = ease(clamp((t - at) / dur, 0, 1));
    opacity = e; ty = (1 - e) * y; tx = (1 - e) * x;
  }
  if (out != null && t >= out) {
    const e = Easing.easeInCubic(clamp((t - out) / outDur, 0, 1));
    opacity *= (1 - e); ty -= e * 14;
  }
  return (
    <div style={{ opacity, transform: `translate(${tx}px, ${ty}px)`, willChange: 'transform, opacity', ...style }}>
      {children}
    </div>
  );
}

// ── FullBg: full-bleed colored panel that crossfades ────────────────────────
function FullBg({ color, fadeIn = 0.45, fadeOut = 0.45 }) {
  const { progress, duration } = useSprite();
  const t = progress * duration;
  let op = 1;
  if (t < fadeIn) op = Easing.easeOutQuad(clamp(t / fadeIn, 0, 1));
  else if (t > duration - fadeOut) op = 1 - Easing.easeInQuad(clamp((t - (duration - fadeOut)) / fadeOut, 0, 1));
  return <div style={{ position: 'absolute', inset: 0, background: color, opacity: op }} />;
}

// ── Eyebrow (mono uppercase, gold) ──────────────────────────────────────────
function Eyebrow({ children, color = C.gold, align = 'center', style = {} }) {
  return (
    <div style={{
      fontFamily: F.mono, fontSize: 22, fontWeight: 500, letterSpacing: '0.18em',
      textTransform: 'uppercase', color, textAlign: align, ...style,
    }}>{children}</div>
  );
}

// ── MoneyCount: animates a euro figure with the mono motif ──────────────────
function MoneyCount({ from = 0, to, start = 0, dur = 1.1, ease = Easing.easeOutExpo,
                      sign = false, suffix = '', format = euro, style = {} }) {
  const t = useTime();
  const e = ease(clamp((t - start) / dur, 0, 1));
  const v = from + (to - from) * e;
  const s = sign && to > 0 ? '+' : '';
  return <span style={style}>{s}{format(v)}{suffix}</span>;
}

// Full-canvas centered column
function Center({ children, justify = 'center', pad = 150, gap = 0, style = {} }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: justify, padding: pad, gap,
      textAlign: 'center', ...style,
    }}>{children}</div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 1 — LA DOULEUR  (0 → 6.2s)  fond noir
// ════════════════════════════════════════════════════════════════════════════
function SceneDouleur({ start, end }) {
  return (
    <Sprite start={start} end={end}>
      {() => {
        const s = (x) => start + x; // local → global helper
        return (
          <React.Fragment>
            <Center gap={0}>
              <Reveal at={s(0.3)} out={s(5.4)} y={0} dur={0.6} style={{ marginBottom: 56 }}>
                <Eyebrow color={C.gold}>6 ans dans la boîte · 0 vraie augmentation</Eyebrow>
              </Reveal>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Reveal at={s(0.9)} out={s(5.4)} y={42} dur={0.6}>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 138, lineHeight: 1.0,
                    letterSpacing: '-0.03em', whiteSpace: 'nowrap', paddingBottom: 26 }}>
                    <span style={{ color: C.onDark }}>Tu es </span>
                    <span style={{ color: C.gold }}>sous-payé.</span>
                  </div>
                </Reveal>
              </div>

              <Reveal at={s(2.5)} out={s(5.4)} y={20} dur={0.6} style={{ marginTop: 40 }}>
                <div style={{ fontFamily: F.text, fontWeight: 400, fontSize: 40, color: C.onDarkMut,
                  letterSpacing: '-0.01em' }}>Et au fond, tu le sais déjà.</div>
              </Reveal>
            </Center>
          </React.Fragment>
        );
      }}
    </Sprite>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 2 — LE CHIFFRE  (6.0 → 13.6s)  fond noir, le manque à gagner
// ════════════════════════════════════════════════════════════════════════════
function SceneChiffre({ start, end }) {
  return (
    <Sprite start={start} end={end}>
      {() => {
        const s = (x) => start + x;
        const t = useTime();
        // bar growth
        const grow = (at, dur = 0.9) => Easing.easeOutExpo(clamp((t - at) / dur, 0, 1));
        const BASE_H = 460;                       // marché bar height
        const marchH = BASE_H * grow(s(0.5));
        const toiH   = BASE_H * (56400 / 64800) * grow(s(0.8));
        const gapTop = BASE_H * grow(s(0.8));     // gap region top aligns to full marché height
        const gapH   = Math.max(0, marchH * grow(s(2.0)) - toiH); // red gap appears after

        return (
          <React.Fragment>
            <FullBg color={C.ink} fadeIn={0.01} fadeOut={0.5} />
            <Center justify="center" pad={120} gap={56}>
              <Reveal at={s(0.2)} out={s(7.0)} y={0} dur={0.5}>
                <Eyebrow color={C.gold}>▲ Le manque à gagner</Eyebrow>
              </Reveal>

              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 110 }}>
                {/* —— Bars —— */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 46, height: BASE_H }}>
                  {/* TOI */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                    <div style={{ fontFamily: F.mono, fontSize: 26, fontWeight: 600, color: C.onDark, marginBottom: 14, opacity: grow(s(1.0)) }}>
                      <MoneyCount from={0} to={56400} start={s(0.8)} dur={1.1} />
                    </div>
                    <div style={{ width: 132, height: toiH, background: C.ink700, borderRadius: '6px 6px 0 0',
                      border: '2px solid rgba(255,255,255,0.14)', borderBottom: 'none' }} />
                    <div style={{ fontFamily: F.mono, fontSize: 18, letterSpacing: '0.16em', color: C.onDarkMut, marginTop: 16, textTransform: 'uppercase' }}>Toi</div>
                  </div>
                  {/* MARCHÉ */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                    <div style={{ fontFamily: F.mono, fontSize: 26, fontWeight: 600, color: C.gold, marginBottom: 14, opacity: grow(s(0.7)) }}>
                      <MoneyCount from={0} to={64800} start={s(0.5)} dur={1.1} />
                    </div>
                    <div style={{ position: 'relative', width: 132, height: marchH, background: C.gold,
                      borderRadius: '6px 6px 0 0' }}>
                      {/* red gap = manque à gagner, sitting at top of the toi level */}
                      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: gapH,
                        background: `repeating-linear-gradient(135deg, ${'var(--rouge-500)'} 0 11px, ${'var(--rouge-600)'} 11px 22px)`,
                        borderRadius: '6px 6px 0 0', opacity: grow(s(2.0)) }} />
                    </div>
                    <div style={{ fontFamily: F.mono, fontSize: 18, letterSpacing: '0.16em', color: C.gold300, marginTop: 16, textTransform: 'uppercase' }}>Le marché</div>
                  </div>
                </div>

                {/* —— Verdict —— */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', maxWidth: 620 }}>
                  <Reveal at={s(2.3)} out={s(7.0)} y={24} dur={0.5}>
                    <div style={{ fontFamily: F.text, fontSize: 34, fontWeight: 600, color: C.onDarkMut, marginBottom: 6 }}>Tu perds</div>
                  </Reveal>
                  <Reveal at={s(2.5)} out={s(7.0)} y={30} dur={0.5}>
                    <div style={{ fontFamily: F.mono, fontSize: 132, fontWeight: 700, lineHeight: 0.95, color: C.red,
                      letterSpacing: '-0.02em' }}>
                      <MoneyCount from={0} to={8400} start={s(2.6)} dur={1.3} />
                    </div>
                    <div style={{ fontFamily: F.mono, fontSize: 30, color: C.red, marginTop: 2 }}>chaque année.</div>
                  </Reveal>
                  <Reveal at={s(4.4)} out={s(7.0)} y={22} dur={0.55} style={{ marginTop: 30 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, fontFamily: F.text, fontSize: 30, color: C.onDark }}>
                      <span style={{ color: C.onDarkMut }}>soit</span>
                      <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 38, color: C.onDark }}>42 000 €</span>
                      <span style={{ color: C.onDarkMut }}>sur 5 ans.</span>
                    </div>
                  </Reveal>
                </div>
              </div>
            </Center>
          </React.Fragment>
        );
      }}
    </Sprite>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 3 — LA MÉTHODE  (13.4 → 21.6s)  fond crème, 3 cartes audace
// ════════════════════════════════════════════════════════════════════════════
function MethodCard({ step, title, desc, at }) {
  const t = useTime();
  const p = Easing.easeOutBack(clamp((t - at) / 0.6, 0, 1));
  const op = clamp((t - at) / 0.4, 0, 1);
  return (
    <div style={{
      width: 420, background: C.white, border: `2px solid ${C.ink}`,
      borderRadius: 14, padding: '46px 42px', textAlign: 'left',
      boxShadow: `7px 7px 0 ${C.gold}`,
      opacity: op, transform: `translateY(${(1 - p) * 40}px)`,
      willChange: 'transform, opacity',
    }}>
      <div style={{ fontFamily: F.mono, fontSize: 20, fontWeight: 600, letterSpacing: '0.14em',
        color: C.gold600, textTransform: 'uppercase', marginBottom: 26 }}>Étape {step}</div>
      <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 44, lineHeight: 1.0,
        letterSpacing: '-0.02em', color: C.ink, marginBottom: 18 }}>{title}</div>
      <div style={{ fontFamily: F.text, fontSize: 25, lineHeight: 1.45, color: C.body }}>{desc}</div>
    </div>
  );
}

function SceneMethode({ start, end }) {
  return (
    <Sprite start={start} end={end}>
      {() => {
        const s = (x) => start + x;
        return (
          <React.Fragment>
            <FullBg color={C.cream} fadeIn={0.45} fadeOut={0.5} />
            <Center justify="center" pad={110} gap={0}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, marginBottom: 78 }}>
                <Reveal at={s(0.5)} out={s(7.4)} y={0} dur={0.5}>
                  <Eyebrow color={C.gold600}>La méthode</Eyebrow>
                </Reveal>
                <Reveal at={s(0.7)} out={s(7.4)} y={28} dur={0.55}>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 86, lineHeight: 1.0,
                    letterSpacing: '-0.03em', color: C.ink, whiteSpace: 'nowrap', paddingBottom: 14 }}>On corrige ça.</div>
                </Reveal>
              </div>

              <div style={{ display: 'flex', gap: 36, justifyContent: 'center' }}>
                <MethodCard step="01" title="Ta vraie valeur" desc="Le benchmark du marché, chiffré. Tu sais enfin ce que vaut ton poste." at={s(1.5)} />
                <MethodCard step="02" title="Quoi dire" desc="Le script de négo, mot pour mot. Plus jamais à court d'arguments." at={s(1.9)} />
                <MethodCard step="03" title="Oser demander" desc="La posture pour défendre ton chiffre. Sans trembler, sans t'excuser." at={s(2.3)} />
              </div>
            </Center>
          </React.Fragment>
        );
      }}
    </Sprite>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 4 — LE GAIN  (21.4 → 27.6s)  bande or, le résultat
// ════════════════════════════════════════════════════════════════════════════
function SceneGain({ start, end }) {
  return (
    <Sprite start={start} end={end}>
      {() => {
        const s = (x) => start + x;
        return (
          <React.Fragment>
            <FullBg color={C.gold} fadeIn={0.5} fadeOut={0.45} />
            <Center justify="center" pad={120} gap={0}>
              <Reveal at={s(0.4)} out={s(5.6)} y={0} dur={0.5} style={{ marginBottom: 40 }}>
                <Eyebrow color={C.ink}>Le résultat</Eyebrow>
              </Reveal>

              <Reveal at={s(0.7)} out={s(5.6)} y={26} dur={0.55}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 28,
                  fontFamily: F.mono, fontWeight: 700, color: C.ink }}>
                  <span style={{ fontSize: 52, color: 'var(--encre-800)', textDecoration: 'line-through', textDecorationThickness: 3 }}>56 400 €</span>
                  <span style={{ fontSize: 42, color: 'var(--encre-800)' }}>→</span>
                  <span style={{ fontSize: 116, lineHeight: 0.95, letterSpacing: '-0.02em' }}>
                    <MoneyCount from={56400} to={64800} start={s(1.0)} dur={1.5} />
                  </span>
                </div>
              </Reveal>

              <Reveal at={s(2.2)} out={s(5.6)} y={22} dur={0.5} style={{ marginTop: 26 }}>
                <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 38, color: C.ink }}>
                  ▲ <MoneyCount from={0} to={8400} start={s(2.3)} dur={1.0} sign /> / an récupérés
                </div>
              </Reveal>

              <Reveal at={s(3.3)} out={s(5.6)} y={30} dur={0.6} style={{ marginTop: 56 }}>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 96, lineHeight: 1.0,
                  letterSpacing: '-0.03em', color: C.ink, whiteSpace: 'nowrap', paddingBottom: 16 }}>Tu repars plus riche.</div>
              </Reveal>
              <Reveal at={s(3.8)} out={s(5.6)} y={18} dur={0.5} style={{ marginTop: 14 }}>
                <div style={{ fontFamily: F.text, fontSize: 34, fontWeight: 500, color: 'var(--encre-900)' }}>En quelques semaines. Pas en années.</div>
              </Reveal>
            </Center>
          </React.Fragment>
        );
      }}
    </Sprite>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 5 — CTA  (27.4 → 30s)  fond noir, logo + action
// ════════════════════════════════════════════════════════════════════════════
function LogoLockup({ color = C.onDark }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, whiteSpace: 'nowrap' }}>
      <svg width="56" height="56" viewBox="0 0 48 48" fill="none" aria-label="Le Négociateur" style={{ flexShrink: 0 }}>
        <rect width="48" height="48" rx="11" fill="#16130D" />
        <rect x="10.5" y="27" width="7" height="10.5" rx="2.2" fill="#948876" />
        <rect x="20.5" y="19.5" width="7" height="18" rx="2.2" fill="#D6A24E" />
        <rect x="30.5" y="10" width="7" height="27.5" rx="2.2" fill="#C2872E" />
      </svg>
      <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 38, letterSpacing: '-0.02em', color }}>Le Négociateur</span>
    </div>
  );
}

function SceneCTA({ start, end }) {
  return (
    <Sprite start={start} end={end}>
      {() => {
        const s = (x) => start + x;
        return (
          <Center justify="center" gap={0}>
            <Reveal at={s(0.2)} dur={0.6} y={20} style={{ marginBottom: 44 }}>
              <LogoLockup />
            </Reveal>
            <Reveal at={s(0.6)} dur={0.6} y={30}>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 74, lineHeight: 1.0,
                letterSpacing: '-0.03em', color: C.onDark, whiteSpace: 'nowrap', paddingBottom: 14 }}>
                Calcule ton manque à gagner.
              </div>
            </Reveal>
            <Reveal at={s(1.3)} dur={0.5} y={22} style={{ marginTop: 52 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, background: C.gold,
                color: C.ink, fontFamily: F.text, fontWeight: 700, fontSize: 32, padding: '24px 44px',
                borderRadius: 999, boxShadow: `6px 6px 0 rgba(255,255,255,0.16)` }}>
                Commence — c'est gratuit
                <span style={{ fontFamily: F.mono, fontSize: 30 }}>→</span>
              </div>
            </Reveal>
            <Reveal at={s(1.7)} dur={0.5} y={14} style={{ marginTop: 30 }}>
              <div style={{ fontFamily: F.mono, fontSize: 20, letterSpacing: '0.14em', textTransform: 'uppercase',
                color: C.onDarkMut }}>2 minutes · sans carte bancaire</div>
            </Reveal>
          </Center>
        );
      }}
    </Sprite>
  );
}

Object.assign(window, {
  SceneDouleur, SceneChiffre, SceneMethode, SceneGain, SceneCTA,
  Reveal, FullBg, Eyebrow, MoneyCount, Center, LogoLockup, NEGO_C: C, NEGO_F: F,
});
