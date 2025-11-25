import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import OfflineIndicator from './components/OfflineIndicator';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import { useNotification } from './context/NotificationContext';
import './App.css';
import './animations.css';

// Lazy load views for code splitting
const LogView = lazy(() => import('./views/LogView'));
const MapView = lazy(() => import('./views/MapView'));
const ReportView = lazy(() => import('./views/ReportView'));

function AppContent() {
  const { toasts, removeToast } = useNotification();

  return (
    <Router>
      <div className="app">
        <OfflineIndicator />
        <ToastContainer toasts={toasts} onClose={removeToast} />
        <Header />
        <main className="main-content animate-fade-in">
          <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <LoadingSpinner size="large" message="Loading..." />
            </div>
          }>
            <Routes>
              <Route path="/" element={<LogView />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/report" element={<ReportView />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
