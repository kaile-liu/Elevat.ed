import React, { useState, useEffect } from "react";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react"; // Supabase Auth UI component
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "../integrations/supabase/client"; // Supabase client
import { Navigate, useNavigate, useLocation } from "react-router-dom"; // Import hooks for navigation
import Alert from "@mui/material/Alert";
import { AuthApiError } from "@supabase/supabase-js"; // Import error handling classes from Supabase
import LoadingOverlay from "../components/ui/loadingOverlay";

// Define our Login component
const Login = () => {
  // useNavigate allows us to programmatically redirect the user
  const navigate = useNavigate();
  // errorMessage state to store any authentication error messages for the user
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const togglePassword = () => setShowPassword(!showPassword);

  // useEffect runs when the component mounts, and when navigation changes
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        validateRole(session.user.id);
        //navigate("/dashboard", { replace: true }); // redirect to dashboard if there's an existing session
      }
    };
    checkUser();
  
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          validateRole(session.user.id);
          //navigate("/dashboard", { replace: true }); // redirect to dashboard upon successful sign in
        }
      }
    );
  
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Validate user role from the database
  const validateRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("Users")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (error || !data) {
        setErrorMessage("Unable to fetch user role. Please contact support.");
        return;
      }

      console.log('student role data: ', data)

      // Redirect based on role
      switch (data.role) {
        case "Student":
          navigate("/student", { replace: true });
          break;
        case "Mentor":
          navigate("/mentor", { replace: true });
          break;
        // case "Cas_advisor":
        //   navigate("/cas-advisor", { replace: true });
        //   break;
        case "Admin":
          navigate("/admin", { replace: true });
          break;
        default:
          setErrorMessage("Role not recognized. Contact support.");
      }
    } catch (error) {
      setErrorMessage(error.message || "An error occurred during validation.");
    }
  };

  // Function to produce a user-friendly error message based on a given error from Supabase
  const getErrorMessage = (error) => {
    console.error("Authentication error:", error);
    if (error instanceof AuthApiError) {
      switch (error.code) {
        case "invalid_credentials":
          return "Invalid email or password. Please check your credentials and try again.";
        case "email_not_confirmed":
          return "Please verify your email address before signing in.";
        case "user_not_found":
          return "No user found with these credentials.";
        case "invalid_grant":
          return "Invalid login credentials.";
        default:
          return `Authentication error: ${error.message}`;
      }
    }
    return `Unexpected error: ${error.message}`;
  };

  
  return (
    <div className="flex min-h-screen">
        <LoadingOverlay />
        
        {/* Left side: text and login form */}
       <div className="w-full md:w-1/2 flex flex-col justify-center px-6 sm:px-12 md:px-24 lg:px-48 items-stretch">

          <div className="max-w-sm w-full">
            <div className="mb-5">
              <a className="flex gap-2 items-center justify-center hover:cursor-pointer absolute top-8 left-8"  href='https://www.elevat-ed.co.uk/'>
                <img className="w-10" src='/elevated_logo.png' alt='logo'></img>
                <p className="text-2xl font-semibold !text-green-dark/95">Elevat.ed</p>
              </a> 
              <h3 className="!text-green-dark/85 text-sm mb-4">Continue your journey</h3>
              <h1 className="text-2xl font-bold opacity-95">Sign in to Elevat.Ed</h1>
            </div>
          </div>

          {/* Show error alert if there is an error message */}
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          {/* SupabaseAuth component renders the built-in authentication form */}
          <SupabaseAuth
            view="sign_in"
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              className: {
                container: "space-y-4 w-full"
              },
              style: {
                container: {
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  gap: "1rem",
                },
                input: {
                  padding: "12px 20px",
                  fontSize: "0.875rem",
                },
                label: {
                  marginBottom: "2px",
                },
                button: {
                  backgroundColor: "#9fca45",
                  border: "none"
                }
              },
            }}
            providers={[]}
            localization={{
              variables: {
                log_in: {
                  email_input_label: "E-mail",
                  email_input_placeholder: "school@email.com",
                  password_input_label: "Password",
                  button_label: "Sign In",
                },
              },
            }}
          />
          
        <a href='/forgot-password' className="text-sm w-full text-center !text-green-med-dark font-normal underline">Forgot your password?</a>
        </div>

        {/* Right: Background Image */}
        <div className="hidden md:block md:w-1/2">
          <img
            src="/login-bg.jpg" // replace with actual bg image path
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>

    </div>
  );
};

// Export the Login component as the default export
export default Login;