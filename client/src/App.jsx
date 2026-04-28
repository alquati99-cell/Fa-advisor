import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clienti from './pages/Clienti';
import ClienteForm from './pages/ClienteForm';
import ClienteDettaglio from './pages/ClienteDettaglio';
import Calcolatore from './pages/Calcolatore';
import Simulazione from './pages/Simulazione';
import Storico from './pages/Storico';
import Chat from './pages/Chat';

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
          <Route path="/simulazione/:id" element={<Simulazione />} />
          <Route path="/risultati/:id" element={<Navigate to="/" replace />} />
          <Route path="/storico" element={<Storico />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
