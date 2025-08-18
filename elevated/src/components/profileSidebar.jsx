import React, { useEffect, useState, useRef } from 'react'
import { supabase } from "../integrations/supabase/client"
import * as fetchData from "../utils/fetchData"
import gsap from 'gsap'
import Tooltip from '@mui/material/Tooltip';
import { Popover, Snackbar } from '@mui/material';
import { Pen, Pencil } from "lucide-react"; 
import ConfirmationSnackbar from './ui/ConfirmationSnackbar';
import * as notifications from "../utils/notifications"
import { useTour } from '@reactour/tour'

const ProfileSidebar = ( { isOpen, setIsProfileBarOpen, user } ) => {
  const { setCurrentStep, currentStep } = useTour();

  const [teamMembers, setTeamMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [endorsementUsed, setEndorsementUsed] = useState(false);
  const [pos, setPos] = useState('')
  const [badges, setBadges] = useState([]);
  const [mentorProfile, setMentorProfile] = useState(null)

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isError, setIsError] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');


  useEffect(() => {
    const fetchPageData = async () => {
      const userId = await fetchData.getUserId()
      if (user.role == "Student"){
        // fetch TEAM MEMBERS
        const project = await fetchData.selectSingle("Project_members", "*", "profile_id", user.profile_id)
        const teamMembers = await fetchData.select("Project_members", "*", "project_id", project.project_id)
        const memberProfiles = await Promise.all(teamMembers.map(async (member) => ({
          member: member,
          profile: await fetchData.selectSingle("Users", "*", "profile_id", member.profile_id),
        })))
        setTeamMembers(memberProfiles)

        // fetch leaderboard pos
        const allUsers = await fetchData.select("Users", "*", "school", user.school, 'points', false)
        const allStudents = allUsers.filter(user => user.role == 'Student');
        for (let i = 0; i < allStudents.length; i++) {
            if (allStudents[i].profile_id === user.profile_id) {
                setPos(i+1)
                break;
            }
        }

        //check last_endorsement_given last_endorsement_given
        const last_endorsement_given = new Date(user.last_endorsement_given);
        const now = new Date();
        // Get start of week (Monday)
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday as start
        startOfWeek.setHours(0, 0, 0, 0);
        // Get end of week (Sunday)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        endOfWeek.setHours(0, 0, 0, 0);
        if (last_endorsement_given >= startOfWeek && last_endorsement_given < endOfWeek) setEndorsementUsed(true)

        // fetch badges
        //if (!user?.badges || !Array.isArray(user.badges)) return;
        const fetchedBadges = await Promise.all(
          user.badges.map(async (badgeId) => {
            return await fetchData.selectSingle('Badges', '*', 'badge_id', badgeId);
          })
        );
        setBadges(fetchedBadges);
      
      } else if (user.role == "Mentor") {
        const mentorProfile = await fetchData.selectSingle('Mentors', '*', 'profile_id', user.profile_id)
        setMentorProfile(mentorProfile)
     }
    }
    fetchPageData()
  }, [])

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error){
    console.log('error signing out: ', error)
    }
  }

  const profileSidebarRef = useRef(null)
  // Animate sidebar in/out with GSAP
  useEffect(() => {
    const el = profileSidebarRef.current;
    if (!el) return;

    if (isOpen) {
      gsap.to(el, { x: '0%', duration: 0.4, ease: 'power2.out' });
    } else {
      gsap.to(el, { x: '100%', duration: 0.3, ease: 'power2.in' });
    }
  }, [isOpen])

  const endorse = async (member) => {
    setEndorsementUsed(true)
    setIsError(false)
    const userToEndorse = await fetchData.selectSingle('Users', '*', 'profile_id', member.profile.profile_id)
    try {
      await fetchData.update('Users', 
        {
          'endorsements': userToEndorse.endorsements+1,
          'points': userToEndorse.points+100
        }, 
        'profile_id', member.profile.profile_id
      )
      await fetchData.update('Users', { 'last_endorsement_given': new Date }, 'profile_id', user.profile_id)
      // create a notification for the endorsed user
      notifications.createNotification(member.profile.profile_id, `${user.name} endorsed you`, 'Congrats! You have received +100 points.', '/endorsements.png', 'leaderboard-page-btn')
      setSnackbarMessage(`You endorsed ${member.profile.name}! (Please wait until next week to endorse another team member)`);
      setSnackbarOpen(true);
    } 
    catch (err) {
      console.error('Failed to update endorsements:', err.message);
      setSnackbarMessage('Failed to endorse. Please contact support to report this issue.');
      setSnackbarOpen(true);
    }
  }

  const handleCropComplete = ({ blob, url }) => {
    // Upload blob to Supabase or preview using `url`
    console.log("Cropped URL:", url);
  };

  return (
    <div ref={profileSidebarRef} id='profile-sidebar'  className='w-80 absolute z-2 right-0 flex flex-col justify-start items-center gap-6 h-full p-8 pt-10 bg-[#FDFFFB]'>
      <img id='close-profile-sidebar-btn' src='/chevron-down.png' className='w-4 h-4 cursor-pointer absolute top-4 left-4 rotate-270' onClick={() => {
        if (currentStep === 4) setCurrentStep(currentStep + 1);
        setIsProfileBarOpen(open => !open)
      }}></img>
      <div>
        <img src={user.pfp ? user.pfp : '/profile.png'} className="w-24 h-24 mx-auto rounded-full relative z-1"></img>
        <div className='flex -mt-4 relative z-3'>
          {
            badges.map((badge, i) => <img src={badge.icon} className={`w-10 h-10 ${i > 0 ? '-ml-3' : ''}`}></img>)
          }
        </div>
      </div>

      <p className='font-medium text-green-dark'>{user.name}</p>

      {user.role == 'Student' ? 
        <>
        <div className='flex w-full justify-evenly'>
          <div className='flex gap-1 items-center'>
            <img src='/leaderboard-position.png' className='w-6'></img>
            <p className='text-md text-green-dark/85 font-medium'>{pos}</p>
          </div>
          <div className='flex gap-1 items-center'>
            <img src='/endorsements.png' className='w-6'></img>
            <p className='text-md text-green-dark/85 font-medium'>{user.endorsements}</p>
          </div>
          <div className='flex gap-1 items-center'>
            <img src='/points.png' className='w-6'></img>
            <p className='text-md text-green-dark/85 font-medium'>{user.points}</p>
          </div>
        </div>

        <div className='flex flex-col w-full items-center gap-4 p-2 border-2 border-green-med-dark/15 rounded-lg'>
          <div className='relative flex items-center'>
            <h3 className='font-normal text-green-dark'>Your Team</h3>
            <Tooltip title="You can endorse one team member each week (resets every Monday)" className='absolute right-[-24px]'
            slotProps={{
              tooltip: {
                sx: { maxWidth: 160, width: 160 }, 
              },
            }}>
              <div className='bg-green-full/80 rounded-full p-1 hover:bg-green-full'><img src='/question-mark.png' className='w-3 h-3 invert'/></div>
            </Tooltip>
          </div>
          {teamMembers.filter(member => member.profile.profile_id != user.profile_id).map(member => (
            <div className='w-full flex justify-between items-center text-sm font-normal text-green-dark/85' key={member.profile.profile_id}>
              <div className='flex items-center gap-2'>
                <img src={member.profile.pfp ? member.profile.pfp : '/profile.png'} className='w-10 h-10 object-cover rounded-full'></img>
                <p>{member.profile.name}</p>
              </div>
              <p className='!text-green-full cursor-pointer p-2 rounded-full hover:bg-green-light transition-all' 
              onClick={(e) => {
                if (endorsementUsed) {
                  setSnackbarMessage(`You have already endorsed a team member this week. Please wait until next week`);
                  setIsError(true)
                  setSnackbarOpen(true);
                } else {
                  setSelectedMember(member)
                  setAnchorEl(e.currentTarget);
                }
              }}>Endorse</p>
              <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                slotProps={{
                  paper: {
                    sx: { 
                      padding: 2, 
                      width: 200,
                      backgroundColor: 'rgba(256,256,256,0.85)', // light gray bg
                      boxShadow: '0px 4px 8px 0px rgba(0, 0, 0, 0.03)', // custom shadow
                      borderRadius: '12px', // rounder corners
                    },
                  },
                }}
              >
              <p className='text-sm'>Endorse {selectedMember ? selectedMember.profile.name : 'User name'}?</p> 
              <button className='text-sm text-green-full mr-2' onClick={() => { 
                endorse(selectedMember)
                setAnchorEl(null)
              }}>
                Yes
              </button>
              <button className='text-sm' onClick={() => setAnchorEl(null)}>
                No
              </button>
            </Popover>
          </div>
          ))}
          
        </div> 
        </> :
          <div className='flex flex-col'>
            {mentorProfile ? (
              <div className='flex flex-col gap-2 text-sm'>
                <h1 className='text-lg w-full text-center'>Your Profile</h1>
                <p><strong>Expertise</strong>: {mentorProfile.expertise}</p>
                <p><strong>Bio</strong>: {mentorProfile.bio}</p>
                <a href={mentorProfile.linkedin}><strong>LinkedIn</strong></a>
              </div>
            ) : (
              <p className='text-sm text-green-dark/70'>Loading mentor profile...</p>
            )}
          </div>
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

export default ProfileSidebar