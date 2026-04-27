import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clienti from './pages/Clienti';
import ClienteForm from './pages/ClienteForm';
import ClienteDettaglio from './pages/ClienteDettaglio';
import Calcolatore from './pages/Calcolatore';
import Risultati from './pages/Risultati';
import Storico from './pages/Storico';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clienti" element={<Clienti />} />
          <Route path="/clienti/nuovo" element={<ClienteForm />} />
          <Route path="/clienti/:id" element={<ClienteDettaglio />} />
          <Route path="/clienti/:id/modifica" element={<ClienteForm />} />
          <Route path="/calcolatore" element={<Calcolatore />} />
          <Route path="/risultati/:id" element={<Risultati />} />
          <Route path="/storico" element={<Storico />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
