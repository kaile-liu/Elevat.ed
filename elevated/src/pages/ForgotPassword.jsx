    import React, { useState } from "react";
import { supabase } from "../integrations/supabase/client";
import LoadingOverlay from "../components/ui/loadingOverlay";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    console.log(email, window.location.origin)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`, 
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Password reset email sent! Please check your inbox.");
    }
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
                <h3 className="!text-green-dark/85 text-sm mb-4">Forgot your password?</h3>
                <h1 className="text-2xl font-semibold opacity-95 mb-8">Enter your email</h1>
                <form onSubmit={handlePasswordReset} className="space-y-8">
                    <input
                    type="email"
                    placeholder="e.g. johndoe@school.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border rounded px-3 py-2 w-full"
                    />
                    <button
                    type="submit"
                    className="bg-green-full text-white py-2 px-4 rounded hover:cursor-pointer"
                    >
                    Send Reset Link
                    </button>
                </form>
            {message && <p className="text-sm mt-2">{message}</p>}
            {error && <p className="!text-red-500 text-sm mt-2">{error}</p>}
                </div>
            </div>
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

export default ForgotPassword;
