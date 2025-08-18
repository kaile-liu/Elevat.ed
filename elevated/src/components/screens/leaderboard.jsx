import React, { useState, useEffect, useRef } from "react";
import * as fetchData from "../../utils/fetchData"
import ProfilePopUp from "../profilePopUp";
import Tooltip from '@mui/material/Tooltip';
import LoadingOverlay from "../ui/loadingOverlay";

const Leaderboard = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])
  const userRef = useRef(null);

  // all students in same school
  useEffect(() => {
    const fetchProjectData = async () => {
      // fetch USERS
      const userId = await fetchData.getUserId()
      const currentUser = await fetchData.selectSingle("Users", "*", "user_id", userId)
      setCurrentUser(currentUser)
      const allUsers = await fetchData.select("Users", "*", "school", currentUser.school, 'points', false)
      const allStudents = allUsers.filter(user => user.role == 'Student');
      setUsers(allStudents)
      setIsLoading(false)
    }
    fetchProjectData()
  }, [])

  useEffect(() => {
    if (userRef.current) {
      userRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [users]);

  // Assume "You" is the logged-in user
  const userIndex = users.findIndex((u) => u.name === "You");

  const topThree = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <>
      
        <div id='leaderboard-page' className="w-full h-full bg-white flex flex-col items-center justify-center relative">
          { !isLoading && 
          <>
            <LoadingOverlay full={false} />
            <Tooltip title={
              <>
              Earn points by receiving endorsements, badges, and completing various other tasks.<br /><br/>
              Endorsements (+100 pts):<br />
              Each student can endorse a fellow team member once per week. These are recognition from your peers for your skills and contributions.<br /><br/>
              Badges (+200 pts):<br />
              Every week, mentors will award badges to students in each team who have done particularly well in a specific field. Badges include 'Research Guru', 'Presentation Expert', and 'Team MVP'.<br /><br/> 
              </>
            } className='absolute top-8 left-8'
              slotProps={{
                tooltip: {
                  sx: { maxWidth: 260, width: 260 }, 
                },
              }}>
                <div className='bg-green-full/80 rounded-full p-2 hover:bg-green-full'><img src='/question-mark.png' className='w-6 h-6 invert'/></div>
              </Tooltip>
            <div className="flex items-end justify-center gap-20 mb-8">
            {[1, 0, 2].map((i) => (
              <div
                key={topThree[i].name}
                className={`flex flex-col items-center ${i === 0 ? "scale-115 pb-4" : ""}`}
              >
                <div
                  className={`w-24 h-24 rounded-full border-4 border-green-full cursor-pointer relative`}
                >
                  <img src={topThree[i].pfp ? topThree[i].pfp : '/profile.png'} alt={topThree[i].name} className="w-full h-full object-cover rounded-full" onClick={() => {
                    setSelectedProfile(topThree[i])
                    console.log(selectedProfile)
                    setIsProfileOpen(true)
                    }}/>
                    <div className="absolute bottom-[-14px] w-full flex justify-center">
                      <div className="w-7 h-7 flex items-center justify-center rounded-full bg-green-full font-semibold text-sm !text-white/90">{i+1}</div>
                    </div>
                </div>
                <span className={`mt-4 font-semibold text-center text-sm ${topThree[i].profile_id == currentUser.profile_id ? ' text-green-full' : ''}`}>{topThree[i].profile_id == currentUser.profile_id ? 'You' : topThree[i].name}</span>
                <div className="flex gap-2 items-center">
                  <img src='/points.png' width={20}></img>
                  <span className="text-green-full font-semibold">{topThree[i].points}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full max-w-2xl h-80 overflow-y-auto bg-green-light rounded-xl shadow p-4">
            {rest.map((user, index) => (
              <div
                key={user.name}
                ref={user.profile_id == currentUser.profile_id ? userRef : null}
                className={`flex items-center justify-between px-4 py-2 rounded-lg mb-2 ${
                  user.profile_id == currentUser.profile_id ? "bg-green-full" : ""
                }`}
              >
                <div className={`${user.profile_id == currentUser.profile_id  ? 'text-white/90 ': 'text-gray-600'} flex items-center gap-3`}>
                  <span className={` font-medium w-5 text-right`}>{index + 4}</span>
                  <div
                    className="w-10 h-10 rounded-full overflow-hidden cursor-pointer"
                  >
                    <img src={user.pfp ? user.pfp : '/profile.png'} alt={user.name} className="w-full h-full object-cover" onClick={() => {
                      setSelectedProfile(user)
                      setIsProfileOpen(true)
                    }}/>
                  </div>
                  <span className="text-sm font-medium">{user.profile_id == currentUser.profile_id ? 'You' : user.name}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <img src='/points.png' width={20}></img>
                  <span className={`${user.profile_id == currentUser.profile_id ? 'text-white/90 ': 'text-green-full'} font-semibold`}>{user.points}</span>
                </div>
              </div>
            ))}
          </div>

          
            {/* Popup Overlay */}
            {isProfileOpen && <ProfilePopUp profile={{profile: selectedProfile}} setIsOpen={setIsProfileOpen}/>}
        </>
        }
        </div>
      
    </>
  );
};

export default Leaderboard;
