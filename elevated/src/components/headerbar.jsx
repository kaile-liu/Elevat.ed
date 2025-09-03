import React, { useEffect, useState } from 'react'
import { IconButton, Badge, Popover, LinearProgress, Button } from '@mui/material';
import NotificationPanel from './notificationPanel';
import { supabase } from "../integrations/supabase/client"
import * as fetchData from "../utils/fetchData"
import * as rewards from "../utils/rewards"
import { useTour } from '@reactour/tour'
import { Mail } from 'lucide-react'
import Popup from "./ui/popup" 
import ImageLightbox from './imageLightbox';
import { createPortal } from "react-dom";

const HeaderBar = ( { setIsProfileBarOpen, user } ) => {
  const { setCurrentStep, currentStep, setIsOpen } = useTour();

  const [profilePic, setProfilePic] = useState('/profile.png')
  const [notifications, setNotifications] = useState([])

  const [supportTickets, setSupportTickets] = useState([])
  const [replyMessage, setReplyMessage] = useState('')
  const [replyOpen, setReplyOpen] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const tasks = rewards.getStartedTasks 

  const [taskAnchor, setTaskAnchor] = useState(null);
  const [completed, setCompleted] = useState(() => {
    const done = Array.isArray(user.get_started_tasks_complete) ? user.get_started_tasks_complete : [];
    return [1, 2, 3, 4].map(id => done.includes(id));
  });

  const handleTaskOpen = (e) => setTaskAnchor(e.currentTarget);
  const handleTaskClose = () => setTaskAnchor(null);
  const taskOpen = Boolean(taskAnchor);

  const progress = (completed.filter(Boolean).length / tasks.length) * 100;

  useEffect(() => {
    console.log(user.profile_id)
    const fetchNotifications = async () => {
      const notifications = await fetchData.select("Notifications", '*', 'profile_id', user.profile_id)
      const sortedNotifications = notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setNotifications(sortedNotifications)
    }
    fetchNotifications()

    const fetchSupportTickets = async () => {
      const tickets = await fetchData.selectNoQuery("Support_tickets", "*");
      const enrichedTickets = await Promise.all(
        tickets.map(async (ticket) => {
          // fetch profile for this ticket
          const profile = await fetchData.selectSingle("Users", "*", "profile_id", ticket.student_id);
          return {
            ...ticket,
            profile: profile || null, // attach profile (assuming one user per id)
          };
        })
      );
      const sorted = enrichedTickets.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setSupportTickets(sorted)
      console.log(tickets, enrichedTickets, sorted)
    }
    fetchSupportTickets()
  }, [])

  const [tourTaken, setTourTaken ] = useState(user.get_started_tasks_complete?.includes(1))
  useEffect(() => {
    const updateTaskCompletion = async () => {
      const currentTasks = Array.isArray(user.get_started_tasks_complete) 
        ? user.get_started_tasks_complete 
        : [];
      const newValue = [...currentTasks, 1]; 
      await fetchData.update('Users', {get_started_tasks_complete: newValue}, 'profile_id', user.profile_id)
    } 
    if (currentStep === 13) {
      if (!tourTaken){
        setTourTaken(true)
        rewards.reward(user, tasks.find(task => task.id === 1).reward)
        updateTaskCompletion()
        setCompleted(prev => {
          const updated = [...prev];
          updated[0] = true;
          return updated;
        });
      }
    }
  }, [currentStep]);

  // notification panel popover states
  const [anchorEl, setAnchorEl] = useState(null);
  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);  
  const open = Boolean(anchorEl);
  const [ticketAnchor, setTicketAnchor] = useState(null);
  const handleTicketOpen = (e) => setTicketAnchor(e.currentTarget);
  const handleTicketClose = () => setTicketAnchor(null);
  const ticketOpen = Boolean(ticketAnchor);
  const [ticketPopupOpen, setTicketPopupOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState({});

  const [trainingOpened, setTrainingOpened ] = useState(user.get_started_tasks_complete?.includes(4))
  const handleStepFour = async () => {
    if (!trainingOpened) {
      await fetchData.update(
        "Users",
        { get_started_tasks_complete: [...(user.get_started_tasks_complete || []), 4] },
        "profile_id",
        user.profile_id
      );
      setTrainingOpened(true)
      rewards.reward(user, rewards.getStartedTasks.find(task => task.id === 4).reward)
    }
    window.open("https://example.com", "_self")
  }

  const handleSendMessage = async () => {
    console.log('send: ')
  }

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
                  <p className="font-semibold text-green-dark mb-2">Get Started Tasks <span className='pl-2 font-medium'>{completed.filter(x => x).length}/4</span></p>
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
                          <p className={`text-sm ${completed[idx] ? 'line-through decoration-green-med-dark' : ''}`}>{task.label}</p>
                        </div>
                        <div className='flex items-center gap-2'>
                          
                          <button
                            className='bg-green-full text-white px-4 py-1 rounded-md'
                            onClick={() => {
                              switch (task.id) {
                                case 1:
                                  setCurrentStep(0);
                                  setIsOpen(true)
                                  break
                                case 2:
                                  document.getElementById('project-page-btn').click()
                                  break
                                case 3:
                                  document.getElementById('chat-page-btn').click()
                                  break
                                case 4:
                                  handleStepFour()
                                  break
                              }  

                              setTaskAnchor(null)
                            }}
                          >
                            {task.action}
                          </button>
                          <span className='flex items-center text-sm !text-green-dark/80'>+{task.reward} <img className='h-6 w-6' src='/points.png'/></span>
                        </div>
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

            {/* ✅ Mail / Support Tickets */}
            { user.role == 'Admin' && 
            <>    
            <IconButton color="inherit" onClick={handleTicketOpen}>
              <Badge badgeContent={supportTickets.filter(ticket => !ticket.viewed).length} color="error"
                sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}>
                <img className='w-5 h-5 text-green-dark' src='/ticket.png'/>
              </Badge>
            </IconButton>

            <Popover
              anchorEl={ticketAnchor}
              open={ticketOpen}
              onClose={handleTicketClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
              <div className="p-4 w-64">
                <p className="font-semibold text-green-dark mb-2">Support Tickets</p>
                <div className="flex flex-col gap-2">
                  {supportTickets.map(ticket =>
                    <div 
                      className="p-2 rounded-md border-2 border-green-light hover:bg-green-light/60 hover:border-green-full/60 hover:border-2 transition cursor-pointer"
                      onClick={async () => {
                        setSelectedTicket(ticket)
                        setTicketPopupOpen(true);
                        setTicketAnchor(null);
                        if (!ticket.viewed) {
                          ticket.viewed = true
                          await fetchData.update('Support_tickets', {viewed: true}, 'ticket_id', ticket.ticket_id)
                        }
                      }}
                    >
                      <span className='flex w-full items-center justify-between mb-2'>
                        <div className='flex items-center gap-2'>
                          <img className='w-6 h-6' src={ticket.profile.pfp ? ticket.profile.pfp : '/profile.png'}/>
                          <p className='text-sm font-medium'>{ticket.profile.name}</p>
                        </div>
                        <p className="text-xs font-medium text-green-dark">Ticket #{ticket.ticket_id}</p>
                      </span>
                      <p className="text-xs text-gray-500 line-clamp-2">{ticket.message}</p>
                    </div>
                  )}
                </div>
              </div>
            </Popover>
            </>
            }

            {/* ✅ Popup for ticket */}
            {ticketPopupOpen && selectedTicket && (
              <Popup setIsOpen={setTicketPopupOpen}>
                <div className="p-4 w-full flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex items-center gap-4">
                    <img
                      className="w-12 h-12 rounded-full border-2 border-green-light"
                      src={selectedTicket.profile.pfp || '/profile.png'}
                      alt={selectedTicket.profile.name}
                    />
                    <div>
                      <p className="font-semibold text-green-dark text-lg">
                        {selectedTicket.profile.name} 
                        <span className='text-sm font-medium'>(profile ID: {selectedTicket.profile.profile_id})</span>
                      </p>
                      <p className="text-sm text-gray-500">{selectedTicket.profile.school}</p>
                    </div>
                  </div>

                  {/* Ticket Message */}
                  <div className="p-3 bg-gray-100 rounded-md border border-gray-300">
                    <p className="text-sm">{selectedTicket.message}</p>
                  </div>

                  {/* Screenshots */}
                  {selectedTicket.screenshots?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedTicket.screenshots.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt=""
                          className="w-32 h-24 object-cover rounded-md border cursor-pointer hover:opacity-80"
                          onClick={() => {
                            setLightboxIndex(idx);
                            setLightboxOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {lightboxOpen && createPortal(
                    <ImageLightbox
                      images={selectedTicket.screenshots}
                      index={lightboxIndex}
                      setIndex={setLightboxIndex}
                      onClose={() => setLightboxOpen(false)}
                    />, 
                    document.body
                  )}

                  {/* Reply button */}
                  <div className="flex justify-end">
                    <button
                      className='bg-green-full px-2 py-1 text-sm rounded-md text-white hover:cursor-pointer'
                      onClick={() => setReplyOpen(true)}
                    >
                      Reply
                    </button>
                  </div>

                  {/* ✅ Reply popup */}
                  {replyOpen && (
                    <Popup setIsOpen={setReplyOpen}>
                      <div className="flex flex-col gap-3 w-full">
                        <textarea
                          className="w-full p-2 border border-gray-300 rounded-md resize-none h-24"
                          placeholder="Write your message..."
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                        />
                        <button
                          className="bg-green-full text-white px-4 py-2 rounded-md self-end hover:cursor-pointer"
                          onClick={async() => {
                            // handle send message here
                            try {
                              const response = await fetch('https://elevat-ed.onrender.com/slack/send-message', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  channel: `student-${selectedTicket.profile.profile_id}`,
                                  text: `${replyMessage}::attachments::[]`, 
                                  profile_id: user.profile_id
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
                            setReplyOpen(false)
                            setTicketPopupOpen(false)
                          }}
                        >
                          Send
                        </button>
                      </div>
                    </Popup>
                  )}
                </div>
              </Popup>
            )}
          


            {/* Notifications */}
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
