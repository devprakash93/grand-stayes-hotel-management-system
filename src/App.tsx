import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/routes/ProtectedRoute";
import ThemeToggle from "@/components/shared/ThemeToggle";

import Home from "@/pages/Home";
import Rooms from "@/pages/Rooms";
import RoomDetails from "@/pages/RoomDetails";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import GuestDashboard from "@/pages/dashboards/GuestDashboard";
import StaffDashboard from "@/pages/dashboards/StaffDashboard";
import AdminDashboard from "@/pages/dashboards/AdminDashboard";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster position="bottom-right" />
        <ThemeToggle />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/rooms/:id" element={<RoomDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/guest-dashboard" element={
              <ProtectedRoute allowedRoles={['guest']}>
                <GuestDashboard />
              </ProtectedRoute>
            } />
            <Route path="/staff-dashboard" element={
              <ProtectedRoute allowedRoles={['staff']}>
                <StaffDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin-dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
