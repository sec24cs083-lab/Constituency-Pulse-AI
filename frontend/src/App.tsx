import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CitizenView from './pages/CitizenView';
import MapPage from './pages/MapPage';
import SchemesPage from './pages/SchemesPage';
import ComplaintsPage from './pages/ComplaintsPage';
import BottomNav from './components/BottomNav';
import AIAssistant from './components/AIAssistant';

export default function App() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Routes>
        <Route path="/citizen" element={<CitizenView />} />
        <Route
          path="*"
          element={
            <>
              <Sidebar />
              <main className="md:ml-[var(--sidebar-width)] flex-1 min-h-screen pb-20 md:pb-0">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/schemes" element={<SchemesPage />} />
                  <Route path="/complaints" element={<ComplaintsPage />} />
                </Routes>
              </main>
              <BottomNav />
              <AIAssistant />
            </>
          }
        />
      </Routes>
    </div>
  );
}
