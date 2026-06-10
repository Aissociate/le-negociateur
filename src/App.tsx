import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Rapport from './pages/Rapport';
import Kit from './pages/Kit';
import Merci from './pages/Merci';
import KitDocument from './pages/KitDocument';
import AdminLayout from './pages/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import Leads from './pages/admin/Leads';
import Benchmarks from './pages/admin/Benchmarks';
import Prompts from './pages/admin/Prompts';
import Emails from './pages/admin/Emails';
import Orders from './pages/admin/Orders';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/rapport/:id" element={<Rapport />} />
      <Route path="/kit" element={<Kit />} />
      <Route path="/merci" element={<Merci />} />
      <Route path="/kit/document/:token" element={<KitDocument />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="benchmarks" element={<Benchmarks />} />
        <Route path="prompts" element={<Prompts />} />
        <Route path="emails" element={<Emails />} />
        <Route path="orders" element={<Orders />} />
      </Route>
    </Routes>
  );
}
