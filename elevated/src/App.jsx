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
    selector: '#sidebar-nav',
    content: 'This is the sidebar, where you can navigate between different pages.',
  },
  {
    selector: '#headerbar-profile',
    content: 'You can view your points, notifications, and profile here.',
  },
  {
    selector: '#open-profile-btn',
    content: 'Click the dropdown to open the profile sidebar.',
  },
  {
    selector: '#profile-sidebar',
    content: 'Here you can view your points, leaderboard position, and your project team members. You can also choose team members to endorse every week (hover over the tooltip to learn more).',
  },
  {
    selector: '#close-profile-sidebar-btn',
    content: 'Click here to close the sidebar.',
  },
  {
    selector: '#project-page-btn',
    content: 'Click here to view the project page.',
  },
  {
    selector: '#project-page',
    content: 'Here you can see your project team members, communicate via the team chat, and manage your project tasks to stay on top of deadlines for deliverables.',
  },
  {
    selector: '#trackr-page-btn',
    content: 'Click here to view the opportunities tracker.',
  },
  {
    selector: '#trackr-page',
    content: 'Here you can search and filter various opportunities and internships to upscale your prospects.',
  },
  {
    selector: '#chat-page-btn',
    content: 'Click here to view your chats.',
  },
  {
    selector: '#chat-page',
    content: 'Here you can chat with your mentor, and also with the other students in your school. You can also submit any issues to the Elevat.Ed support team.',
  },
  {
    selector: '#leaderboard-page-btn',
    content: 'Click here to see the leaderboard.',
  },
  {
    selector: '#leaderboard-page',
    content: 'Here you can see where you place in the leaderboard amongst your peers, as well as a breakdown of the points system.',
  },
  {
    selector: '#learn-page-btn',
    content: 'Click here to be redirected to the training program, where you can find all the materials you need.',
  },
]

function CustomNavigation({ currentStep, steps, setCurrentStep }) {
  // Hide next button on step 0
  const hideNext = [2,4,5,7,9,11].includes(currentStep);

  return (
    <div className={`reactour__navigation w-full mt-2 flex justify-between ${currentStep === 0 ? 'justify-end' : ''}`}>
      {currentStep > 0 && (
        <button onClick={() => setCurrentStep(currentStep - 1)} className="text-sm font-semibold text-green-med-dark hover:cursor-pointer">Back</button>
      )}
      {!hideNext && (
        <button
          aria-label="Go to next step"
          onClick={() => setCurrentStep(currentStep + 1)}
        className="text-sm font-semibold text-green-full hover:cursor-pointer"
        >
          {currentStep == steps.length-1 ? 'End Tour' : 'Next'}
        </button>
      )}
    </div>
  );
}

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
                    <TourProvider 
                    steps={steps} 
                    components={{ Navigation: CustomNavigation }}
                    styles={{
                      badge: (base) => ({
                        ...base,
                        backgroundColor: '#9fca45', // Tailwind green-600
                        color: '#fff',              // white text inside the circle
                        height: '30px',
                        width: '30px',
                      }),
                      popover: (base) => ({
                        ...base,
                        borderRadius: 12,           // example: rounded corners for tooltip
                        padding: '16px',
                        paddingRight: '36px',
                        fontSize: '14px',
                      }),
                    }}>
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
              
              <Route path="/" element={<Home />} />
              {/* <Navigate to="/login" replace /> */}
            </Routes>
          </BrowserRouter>

        </div>

    </QueryClientProvider>
  );
}

export default App
