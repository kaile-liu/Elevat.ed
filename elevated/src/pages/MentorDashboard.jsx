import React from 'react'
import Alert from "@mui/material/Alert"; 
import { supabase } from "../integrations/supabase/client"; // Supabase client
import { useState, useEffect, useRef } from 'react';
import { LogOut } from "lucide-react";
import ProfileSidebar from '../components/profileSidebar';
import HeaderBar from '../components/headerbar';
import * as fetchData from '../utils/fetchData'
import ProjectDashboard from '../components/projectDashboard';
import ChatBox from '../components/chatBox';
import BadgePopup from '../components/badgePopup';
import { io } from 'socket.io-client';
import Tooltip from '@mui/material/Tooltip';
import ConfirmationSnackbar from '../components/ui/ConfirmationSnackbar';
import LoadingOverlay from '../components/ui/loadingOverlay';

const socket = io('https://elevat-ed.onrender.com'); // Replace with your server URL

const MentorDashboard = () => {
  const [menuItems, setMenuItems] = useState({})
  const [selected, setSelected] = useState(null);
  const [userData, setUserData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isProfileBarOpen, setIsProfileBarOpen] = useState(false)
  const [isOpen, setIsOpen] = useState(false);

  const tabs = ['Project overview', 'Individual chat'];
  const [selectedTab, setSelectedTab] = useState('Project overview');

  const [selectedMember, setSelectedMember] = useState(null);
  const [mentorChannelId, setMentorChannelId] = useState(null)
  const mentorChannelIdRef = useRef(null); // ✅ ref to avoid stale closure
  const [messages, setMessages] = useState([])

  // snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isError, setIsError] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  async function signOut() {
      const { error } = await supabase.auth.signOut()
      if (error){
      console.log('error signing out: ', error)
      }
  }
  
  // fetch data
  useEffect(() => {
    const fetchUserData = async () => {
      const userId = await fetchData.getUserId() 
      const mentor = await fetchData.selectSingle('Users', '*', 'user_id', userId)
      setUserData(mentor);

      // get all groups the mentor is responsible for
      const mentorProfile = await fetchData.selectSingle('Mentors', '*', 'profile_id', mentor.profile_id)
      const users = await fetchData.select('Student_mentors', '*', 'mentor_id', mentorProfile.mentor_id)

      const groupEntries = await Promise.all(users.map(async user => {
        const project_member = await fetchData.selectSingle('Project_members', '*', 'profile_id', user.student_id);
        const project_id = project_member.project_id;
        const project = await fetchData.selectSingle('Projects', '*', 'project_id', project_id);
        const membersRaw = await fetchData.select('Project_members', '*', 'project_id', project_id);
        const members = await Promise.all(
          membersRaw.map(member => fetchData.selectSingle('Users', '*', 'profile_id', member.profile_id))
        );
        return [project_id, { project, members }];
      }));
      const groups = Object.fromEntries(groupEntries);
      setMenuItems(groups);
      setSelected(Object.keys(groups)[0])
      setSelectedMember(groups[Object.keys(groups)[0]].members[0])
    };

    fetchUserData();
  }, []);

  // get chat data between the mentor and the selected team member
  useEffect(() => {
    const fetchChatData = async () => {
      //const mentorProfile = await fetchData.selectSingle('Mentors', '*', 'profile_id', userData.profile_id)
      if (selectedMember) {
        const studentMentorPair = await fetchData.selectSingle("Student_mentors", "*", "student_id", selectedMember.profile_id)
        setMentorChannelId(studentMentorPair.student_mentor_id)
        mentorChannelIdRef.current = studentMentorPair.student_mentor_id; // ✅ update ref
        // fetch MENTOR MESSAGES
        try {
          const response = await fetch(`https://elevat-ed.onrender.com/slack/messages?channelName=mentor-${studentMentorPair.student_mentor_id}`);
          if (!response.ok) {
            throw new Error(`Error fetching messages: ${response.statusText}`);
          }
          const data = await response.json();
          setMessages(data.messages) // array of messages
        } catch (err) {
          console.error('Failed to fetch Slack messages:', err);
        }
      }
    }
    fetchChatData()

    // listen to web socket events for new messages
    socket.on('new_message', (msg) => {
      console.log('web socket event detected, message: ', msg) 
      const id = msg.channel.split('-').pop(); 
      console.log(id, mentorChannelIdRef.current)
      if (id == mentorChannelIdRef.current) {
          setMessages(prev => [...prev, msg.message]); // update messages state with new messages
        }
    });
    return () => {
      socket.off('new_message');
    };
  }, [selectedMember])

  if (errorMessage) {
    return <Alert severity="error">{errorMessage}</Alert>;
  }
  if (!userData) {
    return <div className='w-[100vw] h-[100vh] flex justify-center items-center'>Loading...</div>;
  }

  // handle message send
  const handleMessage = async (messageText, profile_id) => {
    try {
      const response = await fetch('https://elevat-ed.onrender.com/slack/send-message', { // old: http://localhost:3000
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: `mentor-${mentorChannelId}`,
          text: messageText,
          profile_id: userData.profile_id
        }),
      });

      if (!response.ok) {
        throw new Error(`Error sending message: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Message sent:', data.message);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }

  // render screen view
  const renderView = () => {
    switch (selectedTab) {
      case 'Project overview':
        console.log(selected)
        if (selected) {
          return <div className='p-4'><ProjectDashboard user={userData} project={menuItems[selected].project} isLocked={false} viewOnly={true}/></div>
        } else {
          return <div>loading project</div>
        }
      case 'Individual chat':
        return <div className='w-full h-full flex'>
          <div className='flex flex-col flex-shrink-0 max-w-fit border-r-2 border-green-med-dark/25 h-full'>
            {menuItems[selected].members.map(member => <div 
            className={`flex gap-2 items-center px-4 py-2 hover:bg-blue-light hover:cursor-pointer transition-all ${selectedMember == member ? 'bg-blue-light' : ''}`}
            onClick={() => setSelectedMember(member)}>
                <img className={`w-10 h-10 object-cover rounded-full ${selectedMember != member ? 'opacity-90' : ''}`} src={member.pfp ? member.pfp : '/profile.png'}/>
                <p className={`text-sm font-medium ${selectedMember != member ? '!text-green-med-dark/90' : ''}`}>{member.name}</p>
              </div>)}
          </div>
          <ChatBox user={selectedMember} onMessage={handleMessage} messages={messages}/>
        </div>
    }
  }

  return (
    <div className='flex flex-col w-screen h-screen overflow-x-hidden'>
      <LoadingOverlay />

      <div className='h-12 w-full'>
        <HeaderBar setIsProfileBarOpen={setIsProfileBarOpen} user={userData}/>
      </div>
      
      <div className="grow flex w-full h-full relative">
        {/* Sidebar */}
        <div className={`w-48 bg-white h-[92vh] flex flex-col items-spread gap-4 sticky top-0 border-r-2 border-green-med-dark/25`}>
            <nav className="flex flex-col">
                {Object.keys(menuItems).map((project_id) => {
                  return <div
                  key={project_id}
                  id={`${project_id}-page-btn`}
                  className={`flex flex-col gap-1 w-full pl-4 p-3 cursor-pointer hover:bg-blue-light transition-all ${
                  selected === project_id ? "bg-blue-light text-blue-full border-l-4 border-blue-full" : "text-gray-600"
                  }`}
                  onClick={() => {
                      setSelected(project_id)
                      setSelectedMember(menuItems[project_id].members[0])
                    }}>
                      <h3>Group {project_id}</h3>
                      <p className='text-sm truncate w-full'>{menuItems[project_id].members.map(member => member.name.split(" ")[0]).join(', ')}</p>
                  </div>
                })}
            </nav>
            <div className="flex items-center gap-3 w-full pl-6 p-3 text-sm cursor-pointer text-red-500 hover:bg-red-100 mt-auto transition-all"
                onClick={signOut}>
                <LogOut size={16} />
                <span>Sign Out</span>
            </div>
        </div>
        
        {/** darken bg + profile sidebar slide out */}
        <div className={`bg-black/15 absolute z-1 w-full h-full ${isProfileBarOpen ? 'opacity-100' : 'opacity-0 hidden'} transition-all`}></div>
        <ProfileSidebar isOpen={isProfileBarOpen} setIsProfileBarOpen={setIsProfileBarOpen} user={userData}/>
                
        <div className='relative w-full h-full bg-green-light/20'>
          <div className='h-12 w-full'>
          <div className='flex items-end justify-start gap-4 bg-green-med-dark/5 border-b-2 border-b-green-med-dark/25 w-full h-full px-4 text-sm font-medium'>
            {tabs.map(tab => (
              <p
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`cursor-pointer pb-2 transition-all ${
                  selectedTab === tab ? 'border-b-3 border-green-full text-green-full' : 'border-b-3 border-transparent !text-green-med-dark/75'
                }`}
              >
                {tab}
              </p>
            ))}
            
            <button 
              className='outline-none text-green-full bg-white/95 px-2 py-1 border-2 border-green-med-dark/25 rounded-full ml-auto mr-6 mb-1 hover:bg-green-full hover:text-white/95 transition-all'
              onClick={() => setIsOpen(true)}
              >Award Badges
            </button>

            <Tooltip title={
            <>
              As a mentor you can award badges to students:<br /><br/>
              Research Guru (+200 pts):<br />
              Awarded to students who demonstrate outstanding initiative in gathering, analyzing, or synthesizing research relevant to their project.<br /><br />
              Presentation Expert (+200 pts):<br />
              Given to students who excel in communicating ideas clearly, confidently presenting in team or client meetings, or elevating group presentations.<br /><br />
              Team MVP (+400 pts):<br />
              Recognizes a student who has gone above and beyond to support the team — through leadership, problem-solving, or consistently high contributions.
            </>
            } className='absolute top-4 right-4'
              slotProps={{
                tooltip: {
                  sx: { maxWidth: 260, width: 260 }, 
                },
              }}>
            <div className='bg-green-full/80 rounded-full p-1 hover:bg-green-full'><img src='/question-mark.png' className='w-3 h-3 invert'/></div>
          </Tooltip>

          </div>
        </div>
          {renderView()}
        </div>
      </div>

      {/* Popup Overlay */}
      {selected &&
        <BadgePopup isOpen={isOpen} setIsOpen={setIsOpen} members={menuItems[selected].members} setSnackbarOpen={setSnackbarOpen} setSnackbarMessage={setSnackbarMessage}/>
      }

      <ConfirmationSnackbar
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        error={isError}
      />
    </div>
  )
}

export default MentorDashboard