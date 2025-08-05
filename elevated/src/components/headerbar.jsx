import React, { useEffect, useState } from 'react'
import { IconButton, Badge } from '@mui/material';
import NotificationPanel from './notificationPanel';
import { supabase } from "../integrations/supabase/client"
import * as fetchData from "../utils/fetchData"

const HeaderBar = ( { setIsProfileBarOpen, user } ) => {
  const [profilePic, setProfilePic] = useState('/profile.png')
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const fetchNotifications = async () => {
      const notifications = await fetchData.select("Notifications", '*', 'profile_id', user.profile_id)
      const sortedNotifications = notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      console.log(notifications)
      setNotifications(sortedNotifications)
    }
    fetchNotifications()
  }, [])

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
        <div className='flex gap-4 items-center h-fit'>
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
                <img src='/chevron-down.png' className='w-4 h-4 cursor-pointer' onClick={() => setIsProfileBarOpen(open => !open)}></img>
            </div>
        </div>
    </div>
  )
}

export default HeaderBar