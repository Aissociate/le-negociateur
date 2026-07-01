import { Suspense, lazy } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';
import PixelTracker from './components/PixelTracker';
import Landing from './pages/Landing';
import Questionnaire from './pages/Questionnaire';
import Reveal from './pages/Reveal';
import Kit from './pages/Kit';

// Chargées à la demande (post-achat, espace client, admin) — allège le bundle initial.
const Merci = lazy(() => import('./pages/Merci'));
const KitDocument = lazy(() => import('./pages/KitDocument'));
const Personnaliser = lazy(() => import('./pages/Personnaliser'));
const Formation = lazy(() => import('./pages/Formation'));
const Desinscription = lazy(() => import('./pages/Desinscription'));
const Oto = lazy(() => import('./pages/Oto'));
const Compte = lazy(() => import('./pages/Compte'));
const Simulateur = lazy(() => import('./pages/Simulateur'));
const Legal = lazy(() => import('./pages/Legal'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Funnel = lazy(() => import('./pages/admin/Funnel'));
const Leads = lazy(() => import('./pages/admin/Leads'));
const Orders = lazy(() => import('./pages/admin/Orders'));
const Emails = lazy(() => import('./pages/admin/Emails'));
const Prompts = lazy(() => import('./pages/admin/Prompts'));
const Benchmarks = lazy(() => import('./pages/admin/Benchmarks'));
const Products = lazy(() => import('./pages/admin/Products'));
const ABResults = lazy(() => import('./pages/admin/ABResults'));
const Prospection = lazy(() => import('./pages/admin/Prospection'));
const Orchestration = lazy(() => import('./pages/admin/Orchestration'));
const IntelTest = lazy(() => import('./pages/admin/IntelTest'));
const OtoConfig = lazy(() => import('./pages/admin/OtoConfig'));
const PersonasConfig = lazy(() => import('./pages/admin/PersonasConfig'));

function NotFound() {
  return (
    <Layout narrow>
      <div className="text-center py-20">
        <h1 className="text-4xl font-display font-bold">404</h1>
        <p className="mt-2 text-paper/60">Cette page n'existe pas.</p>
        <Link to="/" className="text-gold underline mt-4 inline-block">Retour à l'accueil</Link>
      </div>
    </Layout>
  );
}

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-paper/40">…</div>}>
      <PixelTracker />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/analyse" element={<Questionnaire />} />
        <Route path="/rapport/:id" element={<Reveal />} />
        <Route path="/kit" element={<Kit />} />
        <Route path="/merci" element={<Merci />} />
        <Route path="/kit/document/:token" element={<KitDocument />} />
        <Route path="/personnaliser" element={<Personnaliser />} />
        <Route path="/formation" element={<Formation />} />
        <Route path="/compte" element={<Compte />} />
        <Route path="/simulateur" element={<Simulateur />} />
        <Route path="/oto" element={<Oto />} />
        <Route path="/desinscription" element={<Desinscription />} />
        <Route path="/mentions" element={<Legal page="mentions" />} />
        <Route path="/confidentialite" element={<Legal page="confidentialite" />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="funnel" element={<Funnel />} />
          <Route path="leads" element={<Leads />} />
          <Route path="prospection" element={<Prospection />} />
          <Route path="benchmarks" element={<Benchmarks />} />
          <Route path="intel-test" element={<IntelTest />} />
          <Route path="products" element={<Products />} />
          <Route path="oto" element={<OtoConfig />} />
          <Route path="ab" element={<ABResults />} />
          <Route path="prompts" element={<Prompts />} />
          <Route path="personas" element={<PersonasConfig />} />
          <Route path="emails" element={<Emails />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orchestration" element={<Orchestration />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
