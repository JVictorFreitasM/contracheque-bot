// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Lotes from './pages/Lotes';
import Pendentes from './pages/Pendentes';
import Erros from './pages/Erros';
import Funcionarios from './pages/Funcionarios';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import Monitoramento from './pages/Monitoramento';
import './App.css';

const NAV_ITEMS = [
  { section: 'Principal' },
  { path: '/dashboard', icon: 'fas fa-chart-pie', label: 'Dashboard' },
  { path: '/upload', icon: 'fas fa-cloud-arrow-up', label: 'Upload' },
  { section: 'Processamento' },
  { path: '/lotes', icon: 'fas fa-layer-group', label: 'Lotes' },
  { path: '/pendentes', icon: 'fas fa-clock', label: 'Pendentes' },
  { path: '/erros', icon: 'fas fa-triangle-exclamation', label: 'Erros' },
  { section: 'Cadastros' },
  { path: '/funcionarios', icon: 'fas fa-users', label: 'Funcionários' },
  { section: 'Sistema' },
  { path: '/relatorios', icon: 'fas fa-file-lines', label: 'Relatórios' },
  { path: '/configuracoes', icon: 'fas fa-gear', label: 'Configurações' },
  { path: '/monitoramento', icon: 'fas fa-heart-pulse', label: 'Monitoramento' },
];

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/upload': 'Upload de Contracheques',
  '/lotes': 'Gerenciamento de Lotes',
  '/pendentes': 'Envios Pendentes',
  '/erros': 'Erros de Processamento',
  '/funcionarios': 'Cadastro de Funcionários',
  '/relatorios': 'Relatórios',
  '/configuracoes': 'Configurações',
  '/monitoramento': 'Monitoramento',
};

function AppContent() {
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const pageTitle = PAGE_TITLES[location.pathname] || 'Gestão de Contracheques';
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-layout">
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo">
              <i className="fas fa-file-invoice-dollar"></i>
            </div>
            <div className="sidebar-brand-text">
              <strong>Contracheques</strong>
              <span>Painel de Gestão</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item, index) =>
            item.section ? (
              <div key={`s-${index}`} className="sidebar-section-label">
                {item.section}
              </div>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                onClick={closeSidebar}
              >
                <i className={item.icon}></i>
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={() => setIsDark((prev) => !prev)}>
            <i className={isDark ? 'fas fa-sun' : 'fas fa-moon'}></i>
            {isDark ? 'Tema Claro' : 'Tema Escuro'}
          </button>
        </div>
      </aside>

      <div className={`sidebar-overlay${sidebarOpen ? ' active' : ''}`} onClick={closeSidebar} />

      <div className="main-content">
        <header className="topbar">
          <button className="mobile-menu-button" onClick={() => setSidebarOpen((open) => !open)} aria-label="Abrir menu">
            <i className="fas fa-bars"></i>
          </button>
          <div>
            <p className="topbar-subtitle">Bem-vindo ao painel</p>
            <h1 className="topbar-title">{pageTitle}</h1>
          </div>
          <div className="topbar-actions">
            <span className="topbar-badge">
              <i className="fas fa-circle"></i>
              Sistema Online
            </span>
          </div>
        </header>

        <main className="page-content" onClick={closeSidebar}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/lotes" element={<Lotes />} />
            <Route path="/pendentes" element={<Pendentes />} />
            <Route path="/erros" element={<Erros />} />
            <Route path="/funcionarios" element={<Funcionarios />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/monitoramento" element={<Monitoramento />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
