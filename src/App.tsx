import { Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';
import Questionnaire from './pages/Questionnaire';
import Reveal from './pages/Reveal';
import Kit from './pages/Kit';
import Merci from './pages/Merci';
import KitDocument from './pages/KitDocument';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Leads from './pages/admin/Leads';
import Orders from './pages/admin/Orders';
import Emails from './pages/admin/Emails';
import Prompts from './pages/admin/Prompts';
import Benchmarks from './pages/admin/Benchmarks';
import Products from './pages/admin/Products';
import ABResults from './pages/admin/ABResults';
import Prospection from './pages/admin/Prospection';
import Orchestration from './pages/admin/Orchestration';
import IntelTest from './pages/admin/IntelTest';

function Legal({ title }: { title: string }) {
  return (
    <Layout narrow>
      <h1 className="text-2xl font-display font-bold">{title}</h1>
      <p className="mt-4 text-paper/60 text-sm">
        Contenu à compléter (éditeur, hébergeur, traitement des données, droits RGPD, contact DPO).
      </p>
    </Layout>
  );
}

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
    <Routes>
      {/* Public */}
      <Route path="/" element={<Questionnaire />} />
      <Route path="/rapport/:id" element={<Reveal />} />
      <Route path="/kit" element={<Kit />} />
      <Route path="/merci" element={<Merci />} />
      <Route path="/kit/document/:token" element={<KitDocument />} />
      <Route path="/mentions" element={<Legal title="Mentions légales" />} />
      <Route path="/confidentialite" element={<Legal title="Politique de confidentialité" />} />

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="prospection" element={<Prospection />} />
        <Route path="benchmarks" element={<Benchmarks />} />
        <Route path="intel-test" element={<IntelTest />} />
        <Route path="products" element={<Products />} />
        <Route path="ab" element={<ABResults />} />
        <Route path="prompts" element={<Prompts />} />
        <Route path="emails" element={<Emails />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orchestration" element={<Orchestration />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
