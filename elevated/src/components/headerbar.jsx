import React, { useEffect, useState } from 'react'
import { IconButton, Badge } from '@mui/material';
import NotificationPanel from './notificationPanel';
import { supabase } from "../integrations/supabase/client"
import * as fetchData from "../utils/fetchData"
import { useTour } from '@reactour/tour'
import { Popover, LinearProgress, Button } from '@mui/material';
//import CheckCircleIcon from '@mui/icons-material/CheckCircle';
//import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';


const HeaderBar = ( { setIsProfileBarOpen, user } ) => {
  const { setCurrentStep, currentStep, setIsOpen } = useTour();

  const [profilePic, setProfilePic] = useState('/profile.png')
  const [notifications, setNotifications] = useState([])

  const tasks = [
    { id: 1, label: "Take the portal tour" },
    { id: 2, label: "Set your pfp" },
    { id: 3, label: "Say hi in project group chat" },
    { id: 4, label: "Say hi to your mentor" },
    { id: 5, label: "Visit the training program" },
  ];

  const [taskAnchor, setTaskAnchor] = useState(null);
  const [completed, setCompleted] = useState(() => {
    const done = Array.isArray(user.get_started_tasks_complete) ? user.get_started_tasks_complete : [];
    return [1, 2, 3, 4, 5].map(id => done.includes(id));
  });

  const handleTaskOpen = (e) => setTaskAnchor(e.currentTarget);
  const handleTaskClose = () => setTaskAnchor(null);
  const taskOpen = Boolean(taskAnchor);

  const progress = (completed.filter(Boolean).length / tasks.length) * 100;

  useEffect(() => {
    const fetchNotifications = async () => {
      const notifications = await fetchData.select("Notifications", '*', 'profile_id', user.profile_id)
      const sortedNotifications = notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setNotifications(sortedNotifications)
    }
    fetchNotifications()
  }, [])

  useEffect(() => {
    const updateTaskCompletion = async () => {
      const currentTasks = Array.isArray(user.get_started_tasks_complete) 
        ? user.get_started_tasks_complete 
        : [];
      const newValue = [...currentTasks, 1]; // 1 = the task ID you want to mark complete
      await fetchData.update('Users', {get_started_tasks_complete: newValue}, 'profile_id', user.profile_id)
    } 
    if (currentStep === 13) {
      // Last step reached → mark as complete
      updateTaskCompletion()
      setCompleted(prev => {
        const updated = [...prev];
        updated[0] = true;
        return updated;
      });
    }
}, [currentStep]);

  // notification panel popover states
  const [anchorEl, setAnchorEl] = useState(null);
  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);  
  const open = Boolean(anchorEl);

  return (
    <div className='flex items-center justify-between p-4 bg-green-light border-b-green-med-dark/25 border-b-2 w-full h-full'>
        <a className="flex gap-2 items-center justify-center hover:cursor-pointer"  href='https://www.elevat-ed.co.uk/'>
            <img className="w-8" src='/elevated_logo.png' alt='logo'></img>
            <p className="text-xl font-semibold !text-green-dark">Elevat.ed</p>
        </a> 
        <div className='flex gap-4 items-center h-fit' id='headerbar-profile'>
          {/* Get Started Tasks */}
          { user.role == 'Student' && 
          <div>
            <div
              onClick={handleTaskOpen}
              className="flex flex-col items-center cursor-pointer w-28"
            >
              <p className="text-xs font-medium text-green-dark mb-1">Get Started</p>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ width: '100%', borderRadius: '8px', height: 8, '& .MuiLinearProgress-bar': {backgroundColor: '#9fca45'}, backgroundColor: '#d9ebb5' }}
              />
            </div>

            <Popover
              anchorEl={taskAnchor}
              open={taskOpen}
              onClose={handleTaskClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
              <div className="p-4 w-md">
                <p className="font-semibold text-green-dark mb-2">Get Started Tasks</p>
                <div className="flex flex-col gap-3">
                  {tasks.map((task, idx) => (
                    <div key={task.id} className="flex items-center justify-between">
                      {/* Tick circle */}
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            completed[idx]
                              ? "bg-green-full border-green-full text-white"
                              : "bg-gray-200 border-gray-300"
                          }`}
                        >
                          {completed[idx] && <span className="text-xs">✓</span>}
                        </div>
                        <p className="text-sm">{task.label}</p>
                      </div>
                      <button
                        className='bg-green-full text-white px-4 py-1 rounded-md'
                        onClick={() => {
                          if (task.id === 1) {
                            // ✅ Hook up the portal tour
                            setCurrentStep(0);
                            setIsOpen(true)
                          }
                          setTaskAnchor(null)
                        }}
                      >
                        Go
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Popover>
          </div>
          }
          
          { user.role == 'Student' && 
            <div className='flex gap-1 items-center'>
                <img src='/points.png' className='w-5 h-5'></img>
                <p className='text-md text-green-dark/85 font-medium'>{user.points}</p>
            </div>
          }

            <IconButton color="inherit" onClick={handleOpen}>
              <Badge badgeContent={notifications.filter(notif => !notif.viewed).length} color="error"
              sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.7rem'
                  },
                }}>
                <img src='/notifications.png' className='w-5 h-5'></img>
              </Badge>
            </IconButton>

            <NotificationPanel
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              notifications={notifications}
              setNotifications={setNotifications}
            />

            <div className='flex gap-2 items-center' id="profile">
                <img src={user.pfp ? user.pfp : '/profile.png'} className="w-8 mx-auto rounded-full"></img>
                <p className='font-medium text-sm text-green-dark/85'>{user.name}</p>
                <img id='open-profile-btn' src='/chevron-down.png' className='w-4 h-4 cursor-pointer' onClick={() => {
                  if (currentStep === 2) setCurrentStep(currentStep + 1);
                  setIsProfileBarOpen(open => !open)
                }}></img>
            </div>
        </div>
    </div>
  )
}

export default HeaderBar