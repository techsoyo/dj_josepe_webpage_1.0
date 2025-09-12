import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import './App.css';

// Lazy load pages for better performance
import { lazy, Suspense } from 'react';

const Homepage = lazy(() => import('./pages/Homepage'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Content = lazy(() => import('./pages/Content'));
const Sets = lazy(() => import('./pages/Sets'));
const Events = lazy(() => import('./pages/Events'));
const Messages = lazy(() => import('./pages/Messages'));
const Testimonials = lazy(() => import('./pages/Testimonials'));
const Settings = lazy(() => import('./pages/Settings'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Homepage pública */}
          <Route
            path="/"
            element={
              <Suspense fallback={<PageLoader />}>
                <Homepage />
              </Suspense>
            }
          />

          {/* Panel de administración */}
          <Route path="/admin" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route
              path="gallery"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Gallery />
                </Suspense>
              }
            />
            <Route
              path="content"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Content />
                </Suspense>
              }
            />
            <Route
              path="sets"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Sets />
                </Suspense>
              }
            />
            <Route
              path="events"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Events />
                </Suspense>
              }
            />
            <Route
              path="messages"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Messages />
                </Suspense>
              }
            />
            <Route
              path="testimonials"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Testimonials />
                </Suspense>
              }
            />
            <Route
              path="settings"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Settings />
                </Suspense>
              }
            />
          </Route>
        </Routes>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'white',
              color: 'black',
              border: '1px solid #e5e7eb',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
