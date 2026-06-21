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
import AddRepeater from '@/pages/AddRepeater';
import MapView from '@/pages/MapView';
import Nets from '@/pages/Nets';

import Messages from '@/pages/Messages';
import Alerts from '@/pages/Alerts';
import Tools from '@/pages/Tools';
import AntennaCalculator from '@/pages/tools/AntennaCalculator';
import FeedlineCalculator from '@/pages/tools/FeedlineCalculator';
import PLToneLookup from '@/pages/tools/PLToneLookup';
import FrequencyReference from '@/pages/tools/FrequencyReference';
import RepeaterSpacing from '@/pages/tools/RepeaterSpacing';
import Profile from '@/pages/Profile';
import AddContent from '@/pages/AddContent';
import MyBBForum from '@/pages/MyBBForum';
import NetControl from '@/pages/NetControl';
import CreateNet from '@/pages/CreateNet';
import ForumRegister from '@/pages/ForumRegister';
import CreateAlert from '@/pages/CreateAlert';
import LiveCams from '@/pages/LiveCams';
import Gallery from '@/pages/Gallery';
import Members from '@/pages/Members';
import Weather from '@/pages/Weather';
import CineplexMode from '@/pages/CineplexMode';
import CreateEvent from '@/pages/CreateEvent';
import LiveChat from '@/pages/LiveChat';
import NewThread from '@/pages/NewThread';
import ThreadView from '@/pages/ThreadView';
import TestNotifications from '@/pages/TestNotifications.jsx';

// Layout
import AppLayout from '@/components/layout/AppLayout';
import { MyBBAuthProvider, useMyBBAuth } from '@/lib/MyBBAuthContext';

const MyBBProtectedRoute = () => {
  const { mybbUser } = useMyBBAuth();
  if (!mybbUser) return <Navigate to="/login" replace />;
  return <AppLayout />;
};

const AuthenticatedApp = () => {
  // This app uses MyBB forum auth — Base44 auth state is intentionally ignored.
  // MyBBProtectedRoute handles all access control via localStorage session.
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<MyBBProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/repeaters" element={<Repeaters />} />
        <Route path="/repeaters/add" element={<AddRepeater />} />
        <Route path="/repeaters/:id" element={<RepeaterDetail />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/nets" element={<Nets />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/tools/antenna" element={<AntennaCalculator />} />
        <Route path="/tools/feedline" element={<FeedlineCalculator />} />
        <Route path="/tools/pl-tones" element={<PLToneLookup />} />
        <Route path="/tools/frequencies" element={<FrequencyReference />} />
        <Route path="/tools/repeater-spacing" element={<RepeaterSpacing />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/add" element={<AddContent />} />
        <Route path="/community-forum" element={<MyBBForum />} />
        <Route path="/nets/:netId/control" element={<NetControl />} />
        <Route path="/nets/create" element={<CreateNet />} />
        <Route path="/community-forum/register" element={<ForumRegister />} />
        <Route path="/alerts/create" element={<CreateAlert />} />
        <Route path="/live-cams" element={<LiveCams />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/members" element={<Members />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/cineplex" element={<CineplexMode />} />
        <Route path="/events/create" element={<CreateEvent />} />
        <Route path="/live-chat" element={<LiveChat />} />
        <Route path="/forums/new" element={<NewThread />} />
        <Route path="/forums/thread/:id" element={<ThreadView />} />
        <Route path="/test-notifications" element={<TestNotifications />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <AuthProvider>
      <MyBBAuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </MyBBAuthProvider>
    </AuthProvider>
  )
}

export default App