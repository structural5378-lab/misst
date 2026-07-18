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
import Community from '@/pages/Community';
import CommunityThread from '@/pages/CommunityThread';
import CommunityNewThread from '@/pages/CommunityNewThread';
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
import Shopping from '@/pages/Shopping';
import CreateCommunity from '@/pages/CreateCommunity';
import RadioScope from '@/pages/RadioScope';
import Achievements from '@/pages/Achievements';
import Leaderboard from '@/pages/Leaderboard';
import Settings from '@/pages/Settings';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Platform Admin pages
import PlatformAdminDashboard from '@/pages/platform/PlatformAdminDashboard';
import PlatformAdminCommunities from '@/pages/platform/PlatformAdminCommunities';
import PlatformAdminUsers from '@/pages/platform/PlatformAdminUsers';
import PlatformAdminRoles from '@/pages/platform/PlatformAdminRoles';
import PlatformAdminAuditLog from '@/pages/platform/PlatformAdminAuditLog';
import PlatformAdminRoute from '@/components/PlatformAdminRoute';
import PlatformAdminLayout from '@/components/PlatformAdminLayout';
import PlatformAdminAnalytics from '@/pages/platform/PlatformAdminAnalytics';
import PlatformAdminFeatureFlags from '@/pages/platform/PlatformAdminFeatureFlags';
import PlatformAdminThemeBuilder from '@/pages/platform/PlatformAdminThemeBuilder';
import PlatformAdminNotifications from '@/pages/platform/PlatformAdminNotifications';
import PlatformAdminContent from '@/pages/platform/PlatformAdminContent';
import PlatformAdminBadges from '@/pages/platform/PlatformAdminBadges';
import PlatformAdminRadioScope from '@/pages/platform/PlatformAdminRadioScope';
import PlatformAdminForum from '@/pages/platform/PlatformAdminForum';
import PlatformAdminChat from '@/pages/platform/PlatformAdminChat';
import PlatformAdminClubs from '@/pages/platform/PlatformAdminClubs';
import PlatformAdminMedia from '@/pages/platform/PlatformAdminMedia';
import PlatformAdminAppBuilder from '@/pages/platform/PlatformAdminAppBuilder';
import PlatformAdminDeveloper from '@/pages/platform/PlatformAdminDeveloper';
import PlatformAdminSystem from '@/pages/platform/PlatformAdminSystem';
import PlatformAdminThemeDiagnostic from '@/pages/platform/PlatformAdminThemeDiagnostic';
import PlatformAdminReports from '@/pages/platform/PlatformAdminReports';
import PlatformAdminRepeaters from '@/pages/platform/PlatformAdminRepeaters';
import PlatformAdminNets from '@/pages/platform/PlatformAdminNets';
import PlatformAdminNews from '@/pages/platform/PlatformAdminNews';
import PlatformAdminBackup from '@/pages/platform/PlatformAdminBackup';
import PlatformAdminGallery from '@/pages/platform/PlatformAdminGallery';
import PlatformAdminMarketplace from '@/pages/platform/PlatformAdminMarketplace';
import PlatformAdminPrivateMessages from '@/pages/platform/PlatformAdminPrivateMessages';

// Community-scoped pages
import CommunityLayout from '@/components/community/CommunityLayout';
import CommunityHome from '@/pages/community/CommunityHome';
import CommunityChat from '@/pages/community/CommunityChat';
import CommunityForum from '@/pages/community/CommunityForum';
import CommunityMembers from '@/pages/community/CommunityMembers';
import CommunityEvents from '@/pages/community/CommunityEvents';
import CommunityRepeaters from '@/pages/community/CommunityRepeaters';
import CommunityGallery from '@/pages/community/CommunityGallery';
import CommunityFiles from '@/pages/community/CommunityFiles';
import CommunityAdmin from '@/pages/community/CommunityAdmin';
import CommunityMore from '@/pages/community/CommunityMore';

// Layout
import AppLayout from '@/components/layout/AppLayout';
import { MyBBAuthProvider } from '@/lib/MyBBAuthContext';
import DualProtectedRoute from '@/components/DualProtectedRoute';

const AuthenticatedApp = () => {
  // Dual-auth period: users can authenticate via Base44 native auth (email+password)
  // or MyBB forum bridge (username+password). DualProtectedRoute accepts either.
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<DualProtectedRoute />}>
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
        <Route path="/community-forum" element={<Community />} />
        <Route path="/community/thread/:id" element={<CommunityThread />} />
        <Route path="/community/new" element={<CommunityNewThread />} />
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
        <Route path="/shopping" element={<Shopping />} />
        <Route path="/community/create" element={<CreateCommunity />} />
        <Route path="/radioscope" element={<RadioScope />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/settings" element={<Settings />} />

        {/* Community-scoped routes — /c/:slug/* (isolated per community) */}
        <Route element={<CommunityLayout />}>
          <Route path="/c/:slug" element={<CommunityHome />} />
          <Route path="/c/:slug/chat" element={<CommunityChat />} />
          <Route path="/c/:slug/forum" element={<CommunityForum />} />
          <Route path="/c/:slug/members" element={<CommunityMembers />} />
          <Route path="/c/:slug/events" element={<CommunityEvents />} />
          <Route path="/c/:slug/repeaters" element={<CommunityRepeaters />} />
          <Route path="/c/:slug/gallery" element={<CommunityGallery />} />
          <Route path="/c/:slug/files" element={<CommunityFiles />} />
          <Route path="/c/:slug/admin" element={<CommunityAdmin />} />
          <Route path="/c/:slug/more" element={<CommunityMore />} />
        </Route>
      </Route>

      {/* Hidden Platform Admin namespace — completely separate from communities */}
      <Route element={<PlatformAdminRoute />}>
        <Route element={<PlatformAdminLayout />}>
          <Route path="/platform/admin" element={<PlatformAdminDashboard />} />
          <Route path="/platform/admin/communities" element={<PlatformAdminCommunities />} />
          <Route path="/platform/admin/users" element={<PlatformAdminUsers />} />
          <Route path="/platform/admin/roles" element={<PlatformAdminRoles />} />
          <Route path="/platform/admin/audit-log" element={<PlatformAdminAuditLog />} />
          <Route path="/platform/admin/analytics" element={<PlatformAdminAnalytics />} />
          <Route path="/platform/admin/feature-flags" element={<PlatformAdminFeatureFlags />} />
          <Route path="/platform/admin/theme-builder" element={<PlatformAdminThemeBuilder />} />
          <Route path="/platform/admin/notifications" element={<PlatformAdminNotifications />} />
          <Route path="/platform/admin/content" element={<PlatformAdminContent />} />
          <Route path="/platform/admin/badges" element={<PlatformAdminBadges />} />
          <Route path="/platform/admin/radioscope" element={<PlatformAdminRadioScope />} />
          <Route path="/platform/admin/forum" element={<PlatformAdminForum />} />
          <Route path="/platform/admin/chat" element={<PlatformAdminChat />} />
          <Route path="/platform/admin/clubs" element={<PlatformAdminClubs />} />
          <Route path="/platform/admin/media" element={<PlatformAdminMedia />} />
          <Route path="/platform/admin/app-builder" element={<PlatformAdminAppBuilder />} />
          <Route path="/platform/admin/developer" element={<PlatformAdminDeveloper />} />
          <Route path="/platform/admin/system" element={<PlatformAdminSystem />} />
          <Route path="/platform/admin/theme-diagnostic" element={<PlatformAdminThemeDiagnostic />} />
          <Route path="/platform/admin/reports" element={<PlatformAdminReports />} />
          <Route path="/platform/admin/repeaters" element={<PlatformAdminRepeaters />} />
          <Route path="/platform/admin/nets" element={<PlatformAdminNets />} />
          <Route path="/platform/admin/news" element={<PlatformAdminNews />} />
          <Route path="/platform/admin/backup" element={<PlatformAdminBackup />} />
          <Route path="/platform/admin/private-messages" element={<PlatformAdminPrivateMessages />} />
          <Route path="/platform/admin/gallery" element={<PlatformAdminGallery />} />
          <Route path="/platform/admin/marketplace" element={<PlatformAdminMarketplace />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  )
}

export default App