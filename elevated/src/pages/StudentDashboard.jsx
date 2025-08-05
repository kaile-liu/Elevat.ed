import React from 'react'
import Alert from "@mui/material/Alert"; 
import { supabase } from "../integrations/supabase/client"; // Supabase client
import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/sidebar';
import ProfileSidebar from '../components/profileSidebar';
import Home from '../components/screens/home';
import Cas from '../components/screens/cas'
import Opportunities from '../components/screens/opportunities';
import Project from '../components/screens/project';
import HeaderBar from '../components/headerbar';
import Chat from '../components/screens/Chat.jsx';
import Leaderboard from '../components/screens/leaderboard.jsx';
import Settings from '../components/screens/settings.jsx';

const StudentDashboard = () => {
  const [selected, setSelected] = useState('home');
  const [userData, setUserData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isProfileBarOpen, setIsProfileBarOpen] = useState(false)

  // fetch data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session.user.id;
        // Fetch user data from the Users profiles table
        const { data, error } = await supabase
          .from("Users")
          .select("*")
          .eq("user_id", userId)
          .single();
        // error handling
        if (error) {
          setErrorMessage("Error fetching user data. Please try again.");
        } else {
          setUserData(data);
        }
      } catch (error) {
        setErrorMessage("Unexpected error: " + error.message);
      }
    };

    fetchUserData();
  }, []);

  if (errorMessage) {
    return <Alert severity="error">{errorMessage}</Alert>;
  }

  if (!userData) {
    return <div className='w-[100vw] h-[100vh] flex justify-center items-center'>Loading...</div>;
  }

  // render screen view
  const renderView = () => {
    switch (selected) {
      case 'home':
        return <Home user={userData}/>;
      case 'learn':
        return <div>learn View</div>;
      case 'project':
        return <Project />;
      // case 'cas':
      //   return <Cas />;
      case 'trackr':
        return <Opportunities />;
      case 'mentors':
        return <Chat />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'settings':
        return <Settings user={userData}/>;
    }
  }

  return (
    <div className='flex flex-col w-screen h-screen overflow-x-hidden'>
      <div className='h-12 w-full'>
        <HeaderBar setIsProfileBarOpen={setIsProfileBarOpen} user={userData}/>
      </div>
      
      <div className="grow flex w-full h-full relative">
        <Sidebar selected={selected} setSelected={setSelected}/>
        
        {/** darken bg + profile sidebar slide out */}
        <div className={`bg-black/15 absolute z-1 w-full h-full ${isProfileBarOpen ? 'opacity-100' : 'opacity-0 hidden'} transition-all`}></div>
        <ProfileSidebar isOpen={isProfileBarOpen} setIsProfileBarOpen={setIsProfileBarOpen} user={userData}/>

        <div className='relative w-full h-full bg-green-light/20'>
          {renderView()}
        </div>
      </div>

    </div>
  ) 

}

export default StudentDashboard