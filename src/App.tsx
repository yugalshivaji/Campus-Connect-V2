import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, OrganiserRoute, CanteenRoute } from './components/ProtectedRoute';
import Scene from './components/Scene';
import BottomNav from './components/BottomNav';
import RoleHeader from './components/RoleHeader';
import Landing from './pages/Landing';
import HowToUse from './pages/HowToUse';
import Home from './pages/Home';
import EventDetails from './pages/EventDetails';
import Profile from './pages/Profile';
import Calendar from './pages/Calendar';
import CreateEvent from './pages/CreateEvent';
import SocietyProfile from './pages/SocietyProfile';
import Explore from './pages/Explore';
import Notifications from './pages/Notifications';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ManageEvent from './pages/ManageEvent';
import CreateSociety from './pages/CreateSociety';
import CanteenPortal from './pages/CanteenPortal';
import AdminDashboard from './pages/AdminDashboard';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen relative bg-background text-foreground transition-colors duration-300">
            <Scene />
            <RoleHeader />
            
            <main className="relative z-10 w-full min-h-[calc(100dvh-64px)]">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/how-to-use" element={<HowToUse />} />
                  <Route path="/login" element={<Login />} />
                  
                  {/* Student Routes */}
                  <Route path="/home" element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  } />
                  <Route path="/event/:id" element={
                    <ProtectedRoute>
                      <EventDetails />
                    </ProtectedRoute>
                  } />
                  <Route path="/events/:slug" element={
                    <ProtectedRoute>
                      <EventDetails />
                    </ProtectedRoute>
                  } />
                  <Route path="/explore" element={
                    <ProtectedRoute>
                      <Explore />
                    </ProtectedRoute>
                  } />
                  <Route path="/calendar" element={
                    <ProtectedRoute>
                      <Calendar />
                    </ProtectedRoute>
                  } />
                  
                  {/* Common Protected Routes */}
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/notifications" element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  } />
                  <Route path="/society/:id" element={
                    <ProtectedRoute>
                      <SocietyProfile />
                    </ProtectedRoute>
                  } />

                  {/* Organiser/Admin Routes */}
                  <Route path="/dashboard" element={
                    <OrganiserRoute>
                      <Dashboard />
                    </OrganiserRoute>
                  } />
                  <Route path="/create-society" element={
                    <OrganiserRoute>
                      <CreateSociety />
                    </OrganiserRoute>
                  } />
                  <Route path="/edit-society/:id" element={
                    <OrganiserRoute>
                      <CreateSociety />
                    </OrganiserRoute>
                  } />
                  <Route path="/create" element={
                    <OrganiserRoute>
                      <CreateEvent />
                    </OrganiserRoute>
                  } />
                  <Route path="/edit/:id" element={
                    <OrganiserRoute>
                      <CreateEvent />
                    </OrganiserRoute>
                  } />
                  <Route path="/manage/:id" element={
                    <OrganiserRoute>
                      <ManageEvent />
                    </OrganiserRoute>
                  } />

                  {/* Canteen Routes */}
                  <Route path="/canteen" element={
                    <CanteenRoute>
                      <CanteenPortal />
                    </CanteenRoute>
                  } />

                  {/* Admin Only */}
                  <Route path="/admin" element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } />
                </Routes>
              </AnimatePresence>
            </main>

            <BottomNav />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
