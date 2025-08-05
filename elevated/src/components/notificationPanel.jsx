// NotificationPanel.jsx
import React from 'react';
import * as fetchData from "../utils/fetchData"

import {
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Stack,
  Button,
  Divider,
} from '@mui/material';

const NotificationPanel = ({ anchorEl, open, onClose, notifications, setNotifications }) => {
    const formatTime = (timestamp) => {
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now - past;

        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;
        const week = 7 * day;
        const month = 30 * day;

        if (diffMs < minute) return 'just now';
        if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
        if (diffMs < day) return `${Math.floor(diffMs / hour)}hr ago`;
        if (diffMs < 2 * day) return 'yesterday';
        if (diffMs < week) return `${Math.floor(diffMs / day)}d ago`;
        if (diffMs < month) return `${Math.floor(diffMs / week)}w ago`;
        return `${Math.floor(diffMs / month)}mo ago`;
    }

    const handleNotificationClick = async (notif) => {
        // redirect by triggering a nav button click in DOM
        const element = document.getElementById(notif.action);
        if (element) {
            element.click();
        } else {
            console.warn(`No element found with id: ${notif.action}`);
        }

        // mark this notification as viewed both in local state and in Supabase
        setNotifications((prev) =>
            prev.map((otherNotif) =>
                otherNotif.notification_id == notif.notification_id
                ? { ...notif, viewed: true }
                : otherNotif
            )
        );
        await fetchData.update('Notifications', { viewed: true }, 'notification_id', notif.notification_id)
        console.log('notification viewed')
    };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      PaperProps={{
        sx: { width: 360, borderRadius: 2, boxShadow: 3, overflow: 'hidden' },
      }}
    >
      {/* Header */}
      <div>
        <h3 className='w-full px-4 py-2 bg-green-full !text-white font-medium text-md'>Notifications</h3>
      </div>

      {/* Notification List */}
      <List dense disablePadding>
        {notifications.map((notif) => (
          <div key={notif.notification_id}>
            <div className='p-4 flex w-full gap-3 relative'>
              <img  src={notif.icon}  className='w-10 h-10 rounded-full object-cover'></img>
              <div>
                <h3 className='font-semibold text-md'>{notif.title}</h3>
                <div className='flex flex-col gap-1'>
                    <p className='text-sm'>{notif.preview}</p>
                    <p className='text-xs !text-green-dark/60'>{formatTime(notif.created_at)}</p>
                    <Button
                        onClick={() => handleNotificationClick(notif)}
                        size="small"
                        variant="outlined"
                        sx={{ alignSelf: 'start', mt: 0.5, textTransform: 'none', borderColor: 'rgb(108, 176, 253)', color: 'rgb(108, 176, 253)', padding: '0px' }}
                    >
                        View
                    </Button>
                </div>
              </div>

              {!notif.viewed && <div className='absolute top-4 right-4 bg-green-full w-2 h-2 rounded-full'></div>}
            </div>
            <Divider component="li" />
          </div>
        ))}
      </List>

      {/* Footer */}
      <div>
        <h3 className='w-full text-center px-4 py-2 !text-green-full bg-white font-medium text-sm hover:cursor-pointer hover:bg-green-light transition-all'>See all recent activity</h3>
      </div>
    </Popover>
  );
};

export default NotificationPanel;