import React, { useState, useEffect, useRef } from 'react'
import HeaderBar from '../components/headerbar'
import { supabase } from "../integrations/supabase/client"; // Supabase client
import * as fetchData from '../utils/fetchData'
import { LogOut, Search } from "lucide-react";
import { io } from 'socket.io-client';
import ConfirmationSnackbar from '../components/ui/ConfirmationSnackbar';
import ChatBox from '../components/chatBox';
import ProjectDashboard from '../components/projectDashboard';
import AnnouncementPopup from '../components/announcementPopup';
import LoadingOverlay from '../components/ui/loadingOverlay';

const socket = io('https://elevat-ed.onrender.com'); // Replace with your server URL

const AdminDashboard = () => {

  const [menuItems, setMenuItems] = useState({})
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isProfileBarOpen, setIsProfileBarOpen] = useState(false)
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [studentSearch, setStudentSearch] = useState("");

  const [expandedSchools, setExpandedSchools] = useState({});

  const [studentMessages, setStudentMessages] = useState([]);
  const [studentChannelId, setStudentChannelId] = useState(null)
  const studentChannelIdRef = useRef(null); // ✅ ref to avoid stale closure

  // fetch data
  useEffect(() => {
    const fetchUserData = async () => {
      const userId = await fetchData.getUserId()
      const admin = await fetchData.selectSingle('Users', '*', 'user_id', userId)
      setUserData(admin);

      // 1️⃣ Get all projects
      const allProjects = await fetchData.selectNoQuery('Projects', '*');
      // 2️⃣ For each project, fetch members + their user data in parallel
      const projectEntries = await Promise.all(
        allProjects.map(async (project) => {
          const membersRaw = await fetchData.select('Project_members', '*', 'project_id', project.project_id);
          const members = await Promise.all(
            membersRaw.map(member =>
              fetchData.selectSingle('Users', '*', 'profile_id', member.profile_id)
            )
          );
          return {
            school: project.school,
            project_id: project.project_id,
            data: { project, members }
          };
        })
      );
      // 3️⃣ Group into { school: { project_id: { project, members } } }
      const groupedBySchool = projectEntries.reduce((acc, { school, project_id, data }) => {
        if (!acc[school]) acc[school] = {};
        acc[school][project_id] = data;
        return acc;
      }, {});
      // 4️⃣ Update state
      setMenuItems(groupedBySchool);
      // Optional: auto-select first school
      const firstSchool = Object.keys(groupedBySchool)[0]
      setSelectedSchool(firstSchool)
    };

    fetchUserData();
  }, []);

  async function signOut() {
        const { error } = await supabase.auth.signOut()
    }

  const toggleSchool = (school) => {
    setExpandedSchools(prev => ({
      ...prev,
      [school]: !prev[school]
    }));
  };

  useEffect(() => {
      const fetchChat = async () => {
        setStudentChannelId(selectedMember.profile_id)
        studentChannelIdRef.current = selectedMember.profile_id; // ✅ update ref
        // fetch STUDENT MESSAGES
        try {
          const response = await fetch(`https://elevat-ed.onrender.com/slack/messages?channelName=student-${selectedMember.profile_id}`);
          if (!response.ok) {
            throw new Error(`Error fetching messages: ${response.statusText}`);
          }
          const data = await response.json();
          setStudentMessages(data.messages) // array of messages
        } catch (err) {
          console.error('Failed to fetch Slack messages:', err);
        }
      }
      fetchChat()

      // listen to web socket events for new messages
      socket.on('new_message', (msg) => {
        const id = msg.channel.split('-').pop(); 
        if (id == studentChannelIdRef.current) {
            setStudentMessages(prev => [...prev, msg.message]); // update messages state with new messages
          }
      });
      return () => {
        socket.off('new_message');
      };
  }, [selectedMember])

  // handle message send
  const handleStudentMessage = async (messageText, profile_id) => {
    try {
      const response = await fetch('https://elevat-ed.onrender.com/slack/send-message', { // old: http://localhost:3000
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: `student-${studentChannelId}`,
          text: messageText,
          profile_id: userData.profile_id
        }),
      });

      if (!response.ok) {
        throw new Error(`Error sending message: ${response.statusText}`);
      }

      const data = await response.json();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }


  
  if (!userData) {
    return <div className='w-[100vw] h-[100vh] flex justify-center items-center'>Loading...</div>;
  }

  return (
    <div className='flex flex-col w-screen h-screen overflow-x-hidden'>
          <LoadingOverlay />
          
          <div className='h-12 w-full'>
            <HeaderBar setIsProfileBarOpen={setIsProfileBarOpen} user={userData}/>
          </div>
          
          <div className="grow flex w-full h-full relative">
            <div className={`w-48 bg-white h-[92vh] flex flex-col items-spread gap-2 sticky top-0 border-r-2 border-green-med-dark/25`}>
                <h3 className='w-full text-center mt-4 font-semibold'>Schools</h3>
                <nav className="flex flex-col">
                    {Object.keys(menuItems).map((school) => (
                      <div key={school} className="mb-2">
                        {/* School header */}
                        <div
                          className="flex items-center justify-between px-4 py-2 font-medium text-gray-800 cursor-pointer hover:bg-gray-100 rounded-md"
                          onClick={() => {
                            setSelectedSchool(school); // always set the school
                            toggleSchool(school)
                            if (expandedSchools[school]) {
                              setSelectedProject(null)
                              setSelectedMember(null)
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {/* Placeholder for school icon/logo */}
                            <img src='/profile.png' className="w-8 h-8 rounded-full object-cover"></img>
                            <h3 className={`truncate max-w-[140px] ${
                            expandedSchools[school] || selectedSchool == school ? "!text-blue-full" : ""
                          }`}>{school}</h3>
                          </div>
                        </div>

                        {/* Animated dropdown */}
                        <div
                          className={`ml-6 overflow-hidden transition-all duration-300 ease-in-out ${
                            expandedSchools[school] ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="mt-1 flex flex-col gap-1 border-l-2 border-green-med-dark/25">
                            {Object.keys(menuItems[school]).map((project_id) => {
                              const { members } = menuItems[school][project_id];
                              return (
                                <div
                                  key={project_id}
                                  id={`${project_id}-page-btn`}
                                  className={`flex flex-col w-full p-2 cursor-pointer hover:bg-blue-light transition-all rounded-md ${
                                    selectedSchool === school && selectedProject === project_id
                                      ? "!text-blue-full pl-3 "
                                      : "text-gray-600"
                                  }`}
                                  onClick={() => {
                                    //setSelectedSchool(null);
                                    setSelectedProject(project_id);
                                    setSelectedMember(members[0]);
                                  }}
                                >
                                  <h3 className={`transition-all ${
                                    selectedProject === project_id
                                      ? "!text-blue-full"
                                      : "text-gray-600"
                                  }`}>
                                    {menuItems[school][project_id].project.name ||
                                      `Group ${project_id}`}
                                  </h3>
                                  <p className={`text-sm truncate w-full transition-all ${
                                    selectedProject === project_id
                                      ? "!text-blue-full"
                                      : "text-gray-600"
                                  }`}>
                                    {members.map((m) => m.name.split(" ")[0]).join(", ")}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}

                </nav>
                <div className="flex items-center gap-3 w-full pl-6 p-3 text-sm cursor-pointer text-red-500 hover:bg-red-100 mt-auto transition-all"
                    onClick={signOut}>
                    <LogOut size={16} />
                    <span>Sign Out</span>
                </div> 
            </div>

            {selectedSchool && !selectedProject && (
              <div className="w-full h-full flex relative">
                <AnnouncementPopup schools={menuItems} />
                <div className="flex flex-col flex-shrink-0 max-w-fit border-r-2 border-green-med-dark/25 h-full">
                  <h3 className="w-full text-center mt-4 font-semibold">Students</h3>

                  {/* Search Bar */}
                  <div className="px-4 py-2">
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full px-3 py-1 border-2 border-green-med-dark/25 rounded-full text-sm focus:outline-none"
                    />
                  </div>

                  {/* Scrollable Students List */}
                  <div className="overflow-y-auto max-h-screen pb-4">
                    {Object.keys(menuItems[selectedSchool])
                      .flatMap((project_id) =>
                        menuItems[selectedSchool][project_id].members.map((member) => ({
                          ...member,
                          project_id,
                        }))
                      )
                      .filter((member) =>
                        member.name.toLowerCase().includes(studentSearch.toLowerCase())
                      )
                      .map((member) => (
                        <div
                          key={`${member.project_id}-${member.profile_id}`}
                          className={`flex gap-2 items-center px-4 py-2 hover:bg-blue-light hover:cursor-pointer transition-all ${
                            selectedMember?.profile_id === member.profile_id
                              ? 'bg-blue-light'
                              : ''
                          }`}
                          onClick={() => setSelectedMember(member)}
                        >
                          <img
                            className={`w-10 h-10 object-cover rounded-full ${
                              selectedMember?.profile_id !== member.profile_id
                                ? 'opacity-90'
                                : ''
                            }`}
                            src={member.pfp ? member.pfp : '/profile.png'}
                          />
                          <p
                            className={`text-sm font-medium ${
                              selectedMember?.profile_id === member.profile_id
                                ? '!text-blue-full'
                                : '!text-green-dark/90'
                            }`}
                          >
                            {member.name}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Chat box */}
                {selectedMember ? <ChatBox
                  user={selectedMember}
                  onMessage={handleStudentMessage}
                  messages={studentMessages}
                />
                : <p className='w-full h-full flex justify-center items-center'>Select a student to chat.</p>
                }
                
              </div>
            )}

            {selectedProject && menuItems[selectedSchool]?.[selectedProject]?.project
            && <div className='p-4'><ProjectDashboard key={`${selectedSchool}-${selectedProject}`} project={menuItems[selectedSchool][selectedProject].project} isLocked={false} viewOnly={true}/></div>
            }

          </div>
        </div>
  )
}

export default AdminDashboard