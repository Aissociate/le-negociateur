// Orchestration du film (pré-compilé depuis l'inline du HTML d'origine).
// Charge animations.js puis scenes.js avant ce fichier (exports sur window).
const { Stage, SceneDouleur, SceneChiffre, SceneMethode, SceneGain, SceneCTA, useTimeline } = window;

function Seeker() {
  const tl = useTimeline();
  React.useEffect(() => {
    window.__seek = (t) => { tl.setPlaying(false); tl.setTime(t); };
    window.__play = () => tl.setPlaying(true);
  }, [tl]);
  const sec = Math.floor(tl.time);
  React.useEffect(() => {
    const root = document.getElementById('root');
    if (root) root.setAttribute('data-screen-label', '00:' + String(sec).padStart(2, '0'));
  }, [sec]);
  return null;
}

const __params = new URLSearchParams(location.search);
const __seek = __params.get('t');
if (__seek != null) { try { localStorage.setItem('nego-film:t', __seek); } catch (e) {} }
const __autoplay = __params.get('paused') !== '1';

function Film() {
  return (
    <Stage width={1920} height={1080} duration={30} background="var(--encre-950)"
           fps={60} loop={true} controls={false} autoplay={__autoplay} persistKey="nego-film">
      <Seeker />
      <SceneDouleur start={0}     end={6.2}  />
      <SceneChiffre  start={6.0}  end={13.6} />
      <SceneMethode  start={13.4} end={21.6} />
      <SceneGain     start={21.4} end={27.6} />
      <SceneCTA      start={27.4} end={30}   />
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Film />);
