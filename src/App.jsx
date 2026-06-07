import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// App pages
import Dashboard from '@/pages/Dashboard';
import Repeaters from '@/pages/Repeaters';
import RepeaterDetail from '@/pages/RepeaterDetail';
import MapView from '@/pages/MapView';
import Nets from '@/pages/Nets';
import Forums from '@/pages/Forums';
import ForumCategoryPage from '@/pages/ForumCategory';
import ThreadView from '@/pages/ThreadView';
import NewThread from '@/pages/NewThread';
import Messages from '@/pages/Messages';
import Alerts from '@/pages/Alerts';
import Tools from '@/pages/Tools';
import Profile from '@/pages/Profile';
import AddContent from '@/pages/AddContent';
import MyBBForum from '@/pages/MyBBForum';

// Layout
import AppLayout from '@/components/layout/AppLayout';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground">Loading Mist...</span>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/repeaters" element={<Repeaters />} />
          <Route path="/repeaters/:id" element={<RepeaterDetail />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/nets" element={<Nets />} />
          <Route path="/forums" element={<Forums />} />
          <Route path="/forums/category/:id" element={<ForumCategoryPage />} />
          <Route path="/forums/thread/:id" element={<ThreadView />} />
          <Route path="/forums/new" element={<NewThread />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/add" element={<AddContent />} />
          <Route path="/community-forum" element={<MyBBForum />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App