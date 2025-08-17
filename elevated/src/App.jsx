import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import Dashboard from "./pages/StudentDashboard";
import MentorDashboard from "./pages/MentorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CasAdvisorDashboard from "./pages/CasAdvisorDashboard";
import Login from "./pages/Login";
import Home from "./pages/Home";
import { TourProvider, useTour } from '@reactour/tour'

// Define tour steps here
const steps = [
  {
    selector: '#home-page-btn',
    content: 'Welcome to your dashboard!',
  },
  {
    selector: '#profile',
    content: 'Click here to view your profile.',
  },
]

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // Start with null to avoid premature redirects

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) return null; // Prevent rendering until authentication state is confirmed

  return isAuthenticated ? children : <Navigate to="/login" />;
};


function App() {

  const { setIsOpen } = useTour()

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsOpen(true)
      console.log('showing tour')
    }, 2000) // wait for Dashboard to render
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      
        <div className="min-h-screen bg-background text-foreground">
          
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/student"
                element={
                  <ProtectedRoute>
                    <TourProvider steps={steps}>
                      <Dashboard />
                    </TourProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mentor"
                element={
                  <ProtectedRoute>
                    <MentorDashboard />
                  </ProtectedRoute>
                }
              />
              {/* <Route
                path="/cas-advisor"
                element={
                  <ProtectedRoute>
                    <CasAdvisorDashboard />
                  </ProtectedRoute>
                }
              /> */}
              <Route path="/" element={<Home />} />
            </Routes>
          </BrowserRouter>

        </div>

    </QueryClientProvider>
  );
}

export default App
