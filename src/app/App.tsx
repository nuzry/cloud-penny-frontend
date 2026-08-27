import { ConfigProvider, App as AntdApp, theme } from 'antd';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/Landing';
import Dashboard from '../pages/Dashboard';
import ProfilePage from '../pages/Profile';
import SettingsPage from '../pages/Settings';
import ExportPage from '../pages/Export';
import ContactPage from '../pages/Contact';
import AlertsPage from '../pages/Alerts';
import { AuthProvider } from '../features/auth';
import { ProtectedRoute } from '../features/auth';
import AppLayout from '../components/layout/AppLayout';
import { ThemeProvider, useTheme } from './providers';

function InnerApp() {
  const { mode } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#4f46e5',
          colorLink: '#4f46e5',
          borderRadius: 8,
          borderRadiusLG: 12,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
        components: {
          Layout: {
            siderBg: mode === 'dark' ? '#141414' : '#ffffff',
          },
          Menu: {
            darkItemBg: '#141414',
            darkSubMenuItemBg: '#141414',
            darkPopupBg: '#141414',
          },
        },
      }}
    >
      <AuthProvider>
        <AntdApp>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/export" element={<ExportPage />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AntdApp>
      </AuthProvider>
    </ConfigProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <InnerApp />
    </ThemeProvider>
  );
}

export default App;