// @ds-adherence-ignore -- token hexes are inlined by design: they must resolve
//   inside the exported <svg><foreignObject> (video export serializes the svg
//   standalone, where var(--ds-*) can drop out). Values mirror the DS tokens 1:1.
// LeNegoVideo.jsx — "La compétence rare" — 45s brand film for Le Négociateur.
// Mounted via <x-import from="./animations.jsx ./LeNegoVideo.jsx">, so the
// timeline-engine globals are already on window when this evaluates.
const { Stage, Sprite, useTime, useSprite, useTimeline, Easing, clamp } = window;

/* ─── Brand tokens (hard-coded so they resolve inside the export svg) ─── */
const C = {
  ink:    "#16130D", ink900: "#211C14", ink800: "#2F281D", ink700: "#423829",
  ink600: "#5A4E3B", ink500: "#736654", ink400: "#948876", ink300: "#B7AC9A",
  ink200: "#D6CDBE", ink100: "#ECE6DB",
  gold:   "#C2872E", gold600: "#A87C2B", gold400: "#D6A24E", gold300: "#E7C588",
  gold200: "#F1DEB4", gold100: "#F8EED9",
  paper:  "#FCFBF8", paper300: "#F9F6F0", paper500: "#F4F0E8", white: "#FFFFFF",
  red:    "#DD3325", red600: "#C12318", red100: "#FBE2DD",
};
const F = {
  display: "'Bricolage Grotesque','Archivo',system-ui,sans-serif",
  text:    "'Archivo',system-ui,-apple-system,sans-serif",
  mono:    "'Spline Sans Mono',ui-monospace,monospace",
};
const W = 1920, H = 1080;
const frFmt = (v, d = 0) =>
  Number(v).toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });

/* ─── Animation primitives (read the enclosing <Sprite>'s localTime) ─── */
// Staggered entrance line — appears at `delay`s into the sprite, rises + fades in, then holds.
function Line({ delay = 0, dy = 26, dur = 0.6, ease = Easing.easeOutCubic, style, children }) {
  const { localTime } = useSprite();
  const e = ease(clamp((localTime - delay) / dur, 0, 1));
  return (
    <div style={{ opacity: e, transform: `translate3d(0,${(1 - e) * dy}px,0)`, willChange: "transform,opacity", ...style }}>
      {children}
    </div>
  );
}
// Fades its whole subtree out over the last `exit`s of the sprite.
function ExitFade({ exit = 0.4, children, style }) {
  const { localTime, duration } = useSprite();
  const xs = Math.max(0, duration - exit);
  const o = localTime > xs ? 1 - clamp((localTime - xs) / exit, 0, 1) : 1;
  return <div style={{ opacity: o, willChange: "opacity", ...style }}>{children}</div>;
}
// Slow continuous push (ken-burns on type) across the sprite.
function SlowZoom({ from = 1, to = 1.035, origin = "50% 50%", children, style }) {
  const { progress } = useSprite();
  const s = from + (to - from) * progress;
  return <div style={{ transform: `scale(${s})`, transformOrigin: origin, willChange: "transform", ...style }}>{children}</div>;
}
// Mono figure that counts up from `from`→`to` starting at `delay`.
function CountUp({ to, from = 0, delay = 0, dur = 1.5, decimals = 0, prefix = "", suffix = "",
  ease = Easing.easeOutExpo, size = 130, color = C.gold400, weight = 600, style }) {
  const { localTime } = useSprite();
  const v = from + (to - from) * ease(clamp((localTime - delay) / dur, 0, 1));
  return (
    <span style={{ fontFamily: F.mono, fontSize: size, fontWeight: weight, color,
      letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", lineHeight: 1, ...style }}>
      {prefix}{frFmt(v, decimals)}{suffix}
    </span>
  );
}

/* ─── Type helpers ─── */
const Eyebrow = ({ children, color = C.gold, style }) => (
  <div style={{ fontFamily: F.mono, fontSize: 23, fontWeight: 600, letterSpacing: "0.22em",
    textTransform: "uppercase", color, ...style }}>{children}</div>
);
const Disp = ({ children, size = 68, color = C.paper, weight = 800, lh = 0.99, style }) => (
  <div style={{ fontFamily: F.display, fontSize: size, fontWeight: weight, lineHeight: lh,
    letterSpacing: "-0.035em", color, ...style }}>{children}</div>
);
const Gold = ({ children }) => <span style={{ color: C.gold400 }}>{children}</span>;
const Row = ({ top, left = 150, right = 150, align = "center", style, children }) => (
  <div style={{ position: "absolute", left, right, top, textAlign: align, ...style }}>{children}</div>
);

/* ─── Persistent brand bug (mark only — reads on dark + cream) ─── */
function LogoBug() {
  const { localTime } = useSprite();
  const o = clamp(localTime / 0.6, 0, 1);
  return (
    <div style={{ position: "absolute", left: 72, top: 60, opacity: o * 0.92,
      display: "flex", alignItems: "center", gap: 16 }}>
      <img src="assets/logo-mark.svg" width="50" height="50" alt="" style={{ display: "block", borderRadius: 12 }} />
    </div>
  );
}
// Writes the current second onto the mount root so comments can reference a timestamp.
function LabelTicker() {
  const t = useTime();
  const s = Math.floor(t);
  React.useEffect(() => {
    const r = document.querySelector("[data-lenego-root]");
    if (r) r.setAttribute("data-screen-label", "Vidéo " + String(s).padStart(2, "0") + "s");
  }, [s]);
  return null;
}

/* ═══════════════ SCENE 1 — La tension (0–8.6) ═══════════════ */
function SceneTension() {
  return (
    <Sprite start={0.3} end={8.7}>
      <SlowZoom from={1} to={1.04} origin="50% 60%">
        <ExitFade exit={0.45}>
          <Row top={296}>
            <Line delay={0.15}><Disp size={64} color={C.ink200} weight={700}>L’IA&#8201;? Tout le monde s’y met.</Disp></Line>
            <Line delay={2.0} style={{ marginTop: 22 }}>
              <Disp size={70}>La maîtriser vraiment, c’est <Gold>rare.</Gold></Disp>
            </Line>
            <Line delay={4.5} style={{ marginTop: 70 }}>
              <Disp size={44} color={C.ink400} weight={600}>Et ce qui est rare…</Disp>
            </Line>
            <Line delay={6.0} dy={40} dur={0.7} ease={Easing.easeOutBack} style={{ marginTop: 4 }}>
              <Disp size={168} color={C.gold400} weight={800} style={{ letterSpacing: "-0.045em" }}>ça se paie.</Disp>
            </Line>
          </Row>
        </ExitFade>
      </SlowZoom>
    </Sprite>
  );
}

/* ═══════════════ SCENE 2 — Le chiffre (8.6–18.0) ═══════════════ */
function SalaryBars() {
  const { localTime } = useSprite();
  const baseY = 430, BW = 150, gap = 80, startX = 70;
  const bars = [
    { v: 48000, h: 150, color: C.ink400, label: "Aujourd’hui", delay: 0.5 },
    { v: 52600, h: 232, color: C.gold400, label: "Bases IA", delay: 0.78 },
    { v: 56400, h: 314, color: C.gold, label: "Certifié RS6776", delay: 1.06 },
  ];
  return (
    <div style={{ position: "relative", width: 1100, height: 540, margin: "0 auto" }}>
      {/* baseline */}
      <div style={{ position: "absolute", left: startX - 30, width: 640, top: baseY, height: 2, background: C.ink700 }} />
      {bars.map((b, i) => {
        const g = Easing.easeOutCubic(clamp((localTime - b.delay) / 0.85, 0, 1));
        const hh = b.h * g;
        const x = startX + i * (BW + gap);
        const lblO = clamp((localTime - b.delay - 0.55) / 0.4, 0, 1);
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: x, top: baseY - hh, width: BW, height: hh,
              background: b.color, borderRadius: "14px 14px 3px 3px" }} />
            <div style={{ position: "absolute", left: x - 20, width: BW + 40, top: baseY - hh - 50,
              textAlign: "center", opacity: lblO, fontFamily: F.mono, fontSize: 30, fontWeight: 600,
              color: i === 2 ? C.gold300 : C.paper, letterSpacing: "-0.02em" }}>
              {frFmt(b.v)}&#8201;€
            </div>
            <div style={{ position: "absolute", left: x - 30, width: BW + 60, top: baseY + 22,
              textAlign: "center", opacity: lblO, fontFamily: F.mono, fontSize: 19, fontWeight: 500,
              letterSpacing: "0.04em", textTransform: "uppercase", color: i === 2 ? C.gold400 : C.ink300 }}>
              {b.label}
            </div>
          </React.Fragment>
        );
      })}
      {/* red pain tag (top-left) */}
      <div style={{ position: "absolute", left: 64, top: 6, opacity: clamp((localTime - 1.6) / 0.5, 0, 1),
        transform: `translateY(${(1 - clamp((localTime - 1.6) / 0.5, 0, 1)) * 14}px)` }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 10, fontFamily: F.mono,
          fontWeight: 600, color: C.red, fontSize: 46, letterSpacing: "-0.02em" }}>
          <span style={{ fontSize: 28 }}>▼</span>−15&#8201;%
        </div>
        <div style={{ fontFamily: F.text, fontSize: 21, color: C.ink300, marginTop: 2, maxWidth: 230 }}>
          sous ta vraie valeur de marché
        </div>
      </div>
      {/* gold prize callout — clear right column */}
      <div style={{ position: "absolute", right: 0, top: 150, width: 360, textAlign: "left",
        opacity: clamp((localTime - 2.1) / 0.5, 0, 1),
        transform: `translateY(${(1 - clamp((localTime - 2.1) / 0.5, 0, 1)) * 16}px)` }}>
        <div style={{ fontFamily: F.mono, fontSize: 19, fontWeight: 600, letterSpacing: "0.14em",
          textTransform: "uppercase", color: C.gold, marginBottom: 6 }}>▲ Récupérable / an</div>
        <CountUp to={8400} delay={2.1} dur={1.6} prefix="+" suffix="&#8201;€" size={72} color={C.gold400} style={{ whiteSpace: "nowrap" }} />
        <div style={{ fontFamily: F.text, fontSize: 22, color: C.ink200, marginTop: 8, lineHeight: 1.35 }}>
          ce que vaut la compétence rare, chaque année.
        </div>
      </div>
    </div>
  );
}
function SceneNumber() {
  return (
    <Sprite start={8.7} end={18.0}>
      <ExitFade exit={0.45}>
        <Row top={132}>
          <Line delay={0.1}><Eyebrow>Ta valeur sur le marché</Eyebrow></Line>
        </Row>
        <Row top={206} left={0} right={0}>
          <SlowZoom from={1.0} to={1.03} origin="50% 42%"><SalaryBars /></SlowZoom>
        </Row>
        <Row top={866}>
          <Line delay={5.3}>
            <Disp size={46} color={C.paper} weight={700}>
              La compétence rare, c’est ton <Gold>levier de négociation.</Gold>
            </Disp>
          </Line>
        </Row>
      </ExitFade>
    </Sprite>
  );
}

/* ═══════════════ SCENE 3 — La méthode (18.0–30.7) ═══════════════ */
function CreamBg() {
  const { localTime, duration } = useSprite();
  const xs = duration - 0.7;
  const o = localTime < 0.7 ? clamp(localTime / 0.7, 0, 1)
    : localTime > xs ? 1 - clamp((localTime - xs) / 0.7, 0, 1) : 1;
  return <div style={{ position: "absolute", inset: 0, background: C.paper, opacity: o }} />;
}
function CertCard() {
  const t = useTime();
  const { localTime } = useSprite();
  const intro = Easing.easeOutCubic(clamp((localTime - 0.6) / 0.8, 0, 1));
  const bob = Math.sin(t * 0.9) * 7;
  return (
    <div style={{
      position: "absolute", right: 150, top: 286, width: 560,
      opacity: intro, transform: `translate(${(1 - intro) * 70}px, ${bob}px) rotate(-2.4deg)`,
      background: C.white, border: `2px solid ${C.ink}`, borderRadius: 18,
      boxShadow: `12px 12px 0 ${C.gold}`, padding: "34px 38px 30px", willChange: "transform" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <img src="assets/logo-mark.svg" width="46" height="46" alt="" style={{ borderRadius: 11 }} />
        <span style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 600, letterSpacing: "0.16em",
          textTransform: "uppercase", color: C.ink500 }}>Certificat</span>
      </div>
      <div style={{ fontFamily: F.display, fontSize: 44, fontWeight: 800, lineHeight: 1.0,
        letterSpacing: "-0.03em", color: C.ink, marginTop: 26 }}>Fondamentaux<br />de l’IA</div>
      <div style={{ fontFamily: F.text, fontSize: 21, color: C.ink600, marginTop: 12 }}>
        Maîtrise opérationnelle · niveau pro
      </div>
      <div style={{ height: 2, background: C.ink100, margin: "26px 0 24px" }} />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontFamily: F.mono, fontSize: 19, fontWeight: 600, color: C.paper,
          background: C.ink, padding: "9px 16px", borderRadius: 999, letterSpacing: "0.02em" }}>RS6776</span>
        <span style={{ fontFamily: F.mono, fontSize: 19, fontWeight: 600, color: C.gold600,
          border: `2px solid ${C.gold}`, padding: "7px 16px", borderRadius: 999 }}>Qualiopi</span>
        <span style={{ marginLeft: "auto", width: 70, height: 70, borderRadius: "50%",
          background: C.gold, color: C.ink, display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", lineHeight: 1, transform: "rotate(8deg)" }}>
          <span style={{ fontSize: 24, fontWeight: 800 }}>✓</span>
          <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginTop: 3 }}>CPF</span>
        </span>
      </div>
    </div>
  );
}
function CheckItem({ delay, children }) {
  return (
    <Line delay={delay} dy={20} style={{ display: "flex", alignItems: "flex-start", gap: 16, marginTop: 20 }}>
      <span style={{ flex: "0 0 auto", width: 36, height: 36, borderRadius: 9, background: C.ink,
        color: C.gold400, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 21, fontWeight: 800, marginTop: 4 }}>✓</span>
      <span style={{ fontFamily: F.text, fontSize: 31, lineHeight: 1.28, color: C.ink800, fontWeight: 500 }}>{children}</span>
    </Line>
  );
}
function SceneMethod() {
  const chips = ["1 journée", "100 % à distance", "100 % financé CPF"];
  return (
    <Sprite start={18.0} end={30.7}>
      <ExitFade exit={0.5}>
        <div style={{ position: "absolute", left: 150, top: 196, width: 880 }}>
          <Line delay={0.2}><Eyebrow color={C.gold600}>La formation</Eyebrow></Line>
          <Line delay={0.4} style={{ marginTop: 18 }}>
            <Disp size={82} color={C.ink} weight={800}>Une journée pour<br />des bases <Gold>solides.</Gold></Disp>
          </Line>
          <div style={{ marginTop: 26 }}>
            <CheckItem delay={1.5}>Automatise tes tâches répétitives</CheckItem>
            <CheckItem delay={2.0}>Rédige et analyse <b style={{ fontWeight: 700 }}>3× plus vite</b></CheckItem>
            <CheckItem delay={2.5}>Décide avec la donnée, pas au feeling</CheckItem>
          </div>
          <Line delay={3.2} style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 40 }}>
            {chips.map((c, i) => (
              <span key={i} style={{ fontFamily: F.mono, fontSize: 21, fontWeight: 500, color: C.ink,
                border: `2px solid ${C.ink}`, padding: "11px 20px", borderRadius: 999 }}>{c}</span>
            ))}
          </Line>
        </div>
        <CertCard />
      </ExitFade>
    </Sprite>
  );
}

/* ═══════════════ SCENE 4 — La preuve (30.7–38.0) ═══════════════ */
function Stat({ delay, children, label }) {
  return (
    <Line delay={delay} dy={28} style={{ flex: 1, textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center" }}>{children}</div>
      <div style={{ fontFamily: F.text, fontSize: 24, color: C.ink200, marginTop: 14, lineHeight: 1.3 }}>{label}</div>
    </Line>
  );
}
function SceneProof() {
  return (
    <Sprite start={30.7} end={38.0}>
      <ExitFade exit={0.45}>
        <Row top={188}><Line delay={0.1}><Eyebrow>Les résultats, en chiffres</Eyebrow></Line></Row>
        <div style={{ position: "absolute", left: 150, right: 150, top: 320, display: "flex", gap: 40 }}>
          <Stat delay={0.5} label="salariés déjà formés"><CountUp to={300} delay={0.5} dur={1.5} suffix="+" size={150} /></Stat>
          <Stat delay={0.8} label="note de satisfaction"><CountUp to={4.8} delay={0.8} dur={1.5} decimals={1} size={150} /><span style={{ fontFamily: F.mono, fontSize: 64, color: C.ink400, fontWeight: 500 }}>/5</span></Stat>
          <Stat delay={1.1} label="de réussite au certificat"><CountUp to={98} delay={1.1} dur={1.6} suffix="&#8201;%" size={150} /></Stat>
        </div>
        <Row top={700}>
          <Line delay={2.6}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 22, border: `2px solid ${C.ink700}`,
              borderRadius: 16, padding: "22px 34px", maxWidth: 1080 }}>
              <span style={{ fontFamily: F.display, fontSize: 60, color: C.gold400, lineHeight: 0.6 }}>“</span>
              <span style={{ textAlign: "left" }}>
                <span style={{ fontFamily: F.text, fontSize: 30, fontStyle: "italic", color: C.paper, lineHeight: 1.35 }}>
                  En un mois, j’avais de quoi justifier mon augmentation.
                </span>
                <span style={{ display: "block", fontFamily: F.mono, fontSize: 19, color: C.ink300, marginTop: 8,
                  letterSpacing: "0.04em" }}>— Sonia, gestionnaire de projet</span>
              </span>
            </div>
          </Line>
        </Row>
      </ExitFade>
    </Sprite>
  );
}

/* ═══════════════ SCENE 5 — Le passage à l'action (38.0–45.0) ═══════════════ */
function CtaButton() {
  const t = useTime();
  const { localTime } = useSprite();
  const intro = Easing.easeOutBack(clamp((localTime - 2.0) / 0.7, 0, 1));
  const pulse = 1 + Math.max(0, Math.sin(t * 2.4)) * 0.014;
  const nudge = Math.max(0, Math.sin(t * 2.4)) * 5;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 16, opacity: clamp(intro, 0, 1),
      transform: `scale(${(0.85 + 0.15 * clamp(intro, 0, 1)) * pulse})`, transformOrigin: "center",
      background: C.gold, color: C.ink, fontFamily: F.text, fontSize: 36, fontWeight: 700,
      padding: "26px 48px", borderRadius: 999, boxShadow: `7px 7px 0 ${C.ink}`, willChange: "transform" }}>
      Être recontacté
      <span style={{ transform: `translateX(${nudge}px)`, fontSize: 40, display: "inline-block" }}>→</span>
    </div>
  );
}
function SceneCTA() {
  return (
    <Sprite start={38.0} end={45.0}>
      <Row top={250}>
        <Line delay={0.2}>
          <Disp size={74} color={C.paper} weight={800}>Tout le monde s’arrache<br />cette compétence.</Disp>
        </Line>
        <Line delay={1.3} style={{ marginTop: 26 }}>
          <Disp size={50} color={C.ink200} weight={600}>Toi, tu l’auras <Gold>prouvée</Gold> — certificat à l’appui.</Disp>
        </Line>
      </Row>
      <Row top={612}><CtaButton /></Row>
      <Row top={770}>
        <Line delay={2.7}>
          <div style={{ fontFamily: F.mono, fontSize: 22, color: C.ink300, letterSpacing: "0.06em" }}>
            Réponse sous 24&#8201;h · 100&#8201;% finançable CPF · RS6776 · Qualiopi
          </div>
        </Line>
      </Row>
      <Row top={890}>
        <Line delay={3.2} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
          <img src="assets/logo-mark.svg" width="44" height="44" alt="" style={{ borderRadius: 10 }} />
          <span style={{ fontFamily: F.display, fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em", color: C.paper }}>
            Le Négociateur
          </span>
        </Line>
      </Row>
    </Sprite>
  );
}

/* ═══════════════ Compose ═══════════════ */
function LeNegoVideo() {
  return (
    <Stage width={W} height={H} duration={45} background={C.ink} persistKey="lenego-video">
      <Sprite start={17.6} end={30.8}><CreamBg /></Sprite>
      <SceneTension />
      <SceneNumber />
      <SceneMethod />
      <SceneProof />
      <SceneCTA />
      <Sprite start={0.3} end={45}><LogoBug /></Sprite>
      <LabelTicker />
    </Stage>
  );
}
window.LeNegoVideo = LeNegoVideo;
