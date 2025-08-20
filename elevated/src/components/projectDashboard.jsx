import React from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { SquarePen, Upload, FileText, ImageIcon, ExternalLink, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as fetchData from "../utils/fetchData"
import * as rewards from "../utils/rewards"
import CreateTaskPopup from './createTaskPopup';
import TaskCard from './taskCard';
import ProjectChat from './projectChat';
import { supabase } from '../integrations/supabase/client';
import { io } from 'socket.io-client';
import ProfilePopUp from './profilePopUp';
import TaskDetailsPopup from './taskDetailsPopup';
import ConfirmationSnackbar from './ui/ConfirmationSnackbar';
import Tooltip from '@mui/material/Tooltip';

const socket = io('https://elevat-ed.onrender.com'); // Replace with your server URL

const DraggableCard = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white p-3 rounded-xl border-2 border-green-light mb-3 shadow-sm hover:cursor-grab"
    >
      {children}
    </div>
  );
};

const DroppableColumn = ({ id, title, count, color, children }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="bg-green-light rounded-lg p-3 min-h-[160px] max-h-[360px] overflow-y-auto overflow-x-hidden">
      <h4 className={`font-semibold text-sm mb-2 ${color}`}>
        • {title} <span className="text-gray-500">({count})</span>
      </h4>
      <div className='flex flex-col gap-2 max-h-full'>
        {children}
      </div>
    </div>
  );
};

const ProjectDashboard = ( { user, project, isLocked, viewOnly=false } ) => {
  const [activeTab, setActiveTab] = useState('Client Overview');
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileTabOpen, setIsProfileTabOpen] = useState(false);
  const [selectedProfileTab, setSelectedProfileTab] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeCard, setActiveCard] = useState(null);

  // snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isError, setIsError] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // store project states below
  // const [user, setUser] = useState({})
  const [teamMembers, setTeamMembers] = useState([])
  const [messages, setMessages] = useState([])
  const [openPopup, setOpenPopup] = useState(false)
  // task stored here in lists
  const [columns, setColumns] = React.useState({
    todo: [],
    inprogress: [],
    done: [],
  });

  const [userMessaged, setUserMessaged ] = useState(user.get_started_tasks_complete?.includes(2))
  console.log('user message: ', userMessaged)
  // send message to Slack Channel via the '/slack/send-message' endpoint
  const handleMessage = async (messageText, attachments, profile_id) => {
    if (!userMessaged) {
        await fetchData.update(
          "Users",
          { get_started_tasks_complete: [...(user.get_started_tasks_complete || []), 2] },
          "profile_id",
          user.profile_id
        );
        setUserMessaged(true)
        rewards.reward(user, rewards.getStartedTasks.find(task => task.id === 2).reward)
      }
    
    try {
      const response = await fetch('https://elevat-ed.onrender.com/slack/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: `project-group-${project.project_id}`,
          text: `${messageText}::attachments::[${attachments.join(', ')}]`,
          profile_id: profile_id
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

  // fetch members, tasks, chat messages etc here and store in states above
  useEffect(() => {
    const fetchProjectData = async () => {
      // fetch USER
      // const userId = await fetchData.getUserId()
      // const user = await fetchData.selectSingle("Users", "*", "user_id", userId)
      // setUser(user)

      // fetch MEMBERS
      const teamMembers = await fetchData.select("Project_members", "*", "project_id", project.project_id)
      const memberProfiles = await Promise.all(teamMembers.map(async (member) => ({
        member: member,
        profile: await fetchData.selectSingle("Users", "*", "profile_id", member.profile_id),
      })))
      setTeamMembers(memberProfiles)

      // fetch TASKS
      const projectTasksData = await fetchData.select("Project_tasks", "*", "project_id", project.project_id)
      // Create a copy of the empty columns on component mount
      const updatedColumns = {
        todo: [],
        inprogress: [],
        done: [],
      };
      // Fill the correct arrays
      projectTasksData.forEach(task => {
        if (task.status in updatedColumns) { // prevent errors
          updatedColumns[task.status].push(task);
        }
      });
      // update state once
      setColumns(updatedColumns);

      // fetch MESSAGES
      try {
        const response = await fetch(`https://elevat-ed.onrender.com/slack/messages?channelName=project-group-${project.project_id}`);
        if (!response.ok) {
          throw new Error(`Error fetching messages: ${response.statusText}`);
        }
        const data = await response.json();
        setMessages(data.messages) // array of messages
      } catch (err) {
        console.error('Failed to fetch Slack messages:', err);
      }
    }
    fetchProjectData() 
    
    // listen to web socket events for new messages
    socket.on('new_message', (msg) => {
      const id = msg.channel.split('-').pop(); 
      if (id == project.project_id) {
          setMessages(prev => [...prev, msg.message]); // update messages state with new messages
        }
    });

    return () => {
      socket.off('new_message');
    };
  }, [])

  const handleDragEnd = ({ active, over }) => {
    setActiveCard(null)
    if (!over) return;

    const sourceCol = Object.keys(columns).find((colId) =>
      columns[colId].some((task) => task.task_id === active.id)
    );

    const destinationCol = over.id;

    setIsError(false)
    setSnackbarMessage(`Moved task to ${destinationCol}`);
    setSnackbarOpen(true);

    if (sourceCol && destinationCol && sourceCol !== destinationCol) {
      setColumns((prev) => {
        // update local state
        const taskToMove = prev[sourceCol].find((task) => task.task_id === active.id);
        if (!taskToMove) return prev;
      
        const newSource = prev[sourceCol].filter((task) => task.task_id !== active.id);
        const newDestination = [...prev[destinationCol], taskToMove];
      
        return {
          ...prev,
          [sourceCol]: newSource,
          [destinationCol]: newDestination,
        };
      });

      const updateStatus = async () => {
        const taskToUpdate = columns[sourceCol].find(task => task.task_id === active.id);
        if (!taskToUpdate) return;
        try {
          // Update the status in Supabase
          await fetchData.update("Project_tasks", { status: destinationCol }, "task_id", active.id);
        } catch (error) {
          console.error("Failed to update task status in Supabase:", error);
        }
      }
      updateStatus()
    }
  };

  const handleDragStart = (e) => {
    const activeId = e.active.id;
    console.log(activeId)
    // loop through columns to find the card
    for (const column in columns) {
      const task = columns[column].find(card => card.task_id === activeId);
      if (task) {
        //
        setActiveCard(task);
        console.log(task)
        break;
      }
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <div className="flex flex-col md:flex-row gap-6 h-[90vh]">
        {openPopup && <CreateTaskPopup onClose={() => setOpenPopup(false)} teamMembers={teamMembers} project={project} setColumns={setColumns} openSnackbar={() => {
          setIsError(false)
          setSnackbarMessage(`You successfully created a new task.`);
          setSnackbarOpen(true);
        }}/>}
        {selectedTask && (
          <TaskDetailsPopup 
            task={selectedTask} 
            onClose={() => setSelectedTask(null)} 
          />
        )}
        {/* Left Section */}
        <div className="flex-1 flex flex-col relative max-h-[90vh]">
          {isLocked && <div className='absolute inset-0 backdrop-blur-sm bg-white/60 z-50 flex flex-col justify-center items-center'>
            <h2>Locked 🔒</h2>
            <p className='text-sm max-w-[60ch] text-center'>You will be assigned your project brief once everyone has completed the 4-week training - then the fun begins!</p>
          </div>}
          {/* Project Info */}
          <div className="p-4 rounded-xl shadow mb-6 h-48">
            <div className="flex gap-4 mb-2">
              {['Client Overview', 'Project brief'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm font-semibold pb-1 border-b-2 ${
                    activeTab === tab
                      ? 'text-green-full border-green-full'
                      : 'text-green-med-dark border-transparent'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'Client Overview' && (
              <div className="space-y-4 p-2">
                <div className="flex items-center gap-3">
                  {/* Replace with real logo if available */}
                  <img src={project.ngo_logo} width={40}/>
                  <h2 className="text-xl font-semibold">{project.project_ngo}</h2>
                </div>
                <div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {project.ngo_description}
                  </p>
                  <p className='mt-1 cursor-pointer w-full text-right text-sm' onClick={() => setIsOpen(true)}>Read full</p>
                </div>
              </div>
            )}
            {activeTab === 'Project brief' && (
              <div className="space-y-4 p-2">
                <div className="flex items-center gap-3">
                  {/* Replace with real logo if available */}
                  <img src='/target.png' width={40}/>
                  <h2 className="text-xl font-semibold">Project Brief</h2>
                </div>
                <div>
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {project.project_brief}
                  </p>
                  <p className='mt-1 cursor-pointer w-full text-right text-sm' onClick={() => setIsOpen(true)}>Read full</p>
                </div>
              </div>
            )}

            {/* Popup Overlay */}
            {isOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/15">
                {/* Popup Box */}
                <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 relative">
                  <button onClick={() => setIsOpen(false)} className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl">&times;</button>
                  {activeTab === 'Client Overview' && (
                    <div className="space-y-4 p-2">
                      <div className="flex items-center gap-3">
                        {/* Replace with real logo if available */}
                        <img src={project.ngo_logo} width={40}/>
                        <h2 className="text-xl font-semibold">{project.project_ngo}</h2>
                      </div>
                      <p className="text-sm text-gray-700">
                        {project.ngo_description}
                      </p>
                    </div>
                  )}
                  {activeTab === 'Project brief' && (
                    <div className="space-y-4 p-2">
                      <div className="flex items-center gap-3">
                        {/* Replace with real logo if available */}
                        <img src='/target.png' width={40}/>
                        <h2 className="text-xl font-semibold">Project Brief</h2>
                      </div>
                      <p className="text-sm text-gray-700">
                        {project.project_brief}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tasks Section */}
          <div className="bg-white p-4 rounded-xl shadow flex-1 flex flex-col max-h-full">
            <div className="flex justify-between items-center mb-4">
              <div className='flex items-center gap-2'>
                <h3 className="text-lg font-semibold">Project Tasks</h3>
                <Tooltip title='Drag handles in the top-right corner of tasks to move them between columns.' className=''
                  slotProps={{
                    tooltip: {
                      sx: { maxWidth: 160, width: 160 }, 
                    },
                  }}>
                  <div className='bg-green-full/80 rounded-full p-1 hover:bg-green-full'><img src='/question-mark.png' className='w-3 h-3 invert'/></div>
                </Tooltip>
              </div>
              { !viewOnly &&
              <button className="bg-green-full text-white text-sm px-4 py-1 rounded-full hover:bg-green-full/75" onClick={() => setOpenPopup(true)}>Create Task +</button>
              }
              </div>

            <div className="grid md:grid-cols-3 md:grid-rows-1 gap-4 flex-1 max-h-full">
              {['todo', 'inprogress', 'done'].map((columnId) => {
                const columnTitle = {
                  todo: 'To Do',
                  inprogress: 'In Progress',
                  done: 'Done',
                }[columnId];

                const columnColor = {
                  todo: 'text-blue-600', 
                  inprogress: 'text-yellow-600',
                  done: 'text-green-600',
                }[columnId];

                return (
                  <DroppableColumn
                    key={columnId}
                    id={columnId}
                    title={columnTitle}
                    count={columns[columnId].length}
                    color={columnColor} 
                    className=''
                  >
                    {columns[columnId].map((task) => (
                        activeCard == task ? 
                        <DragOverlay>
                          <div onClick={() => setSelectedTask(task)} key={task.task_id}>
                            <TaskCard task={task} isDragging={true} draggable={!viewOnly}/>
                          </div>
                        </DragOverlay>
                      : <div onClick={() => setSelectedTask(task)} key={task.task_id}>
                            <TaskCard task={task} isDragging={false} draggable={columnId == "done" ? false : !viewOnly} onDelete={async () => {
                              console.log('delete')
                              // NOTE need to first remove all records related to this record by task_id
                              await fetchData.remove('Project_tasks', 'task_id', task.task_id)
                            }}/>
                          </div>
                    ))}
                  </DroppableColumn>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Section: Team overview + Chat */}
        <div className="w-full md:w-[400px] flex flex-col h-fill gap-6">
          {/* Team */}
          <div className="bg-white p-4 rounded-xl shadow">
              {/* Left Side: Title + Avatars */}
              <div className="flex flex-col items-center gap-2">
                <div>
                  <h3 className="font-semibold">Team members</h3>
                </div>
                {/* Avatars */}
                <div className="flex space-x-1">
                  {teamMembers.filter(member => member.profile.profile_id != user.profile_id).map((member, idx) => (
                    <div key={member.profile.profile_id} className='relative group' onClick={() => {
                        setSelectedProfileTab(member)
                        setIsProfileTabOpen(true)
                      }}>
                        <p className='absolute whitespace-nowrap -top-8 left-1/2 -translate-x-1/2 bg-white text-xs text-black px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition'>{member.profile.name}</p>
                        <img src={member.profile.pfp ? member.profile.pfp : './profile.png'} alt={member.profile.name} className={`object-cover w-8 h-8 rounded-full`}/>
                    </div>
                  ))}
                </div>
              </div>
          </div>
          {isProfileTabOpen && <ProfilePopUp profile={selectedProfileTab} setIsOpen={setIsProfileTabOpen}/>}

          {/* Chat */}
          <ProjectChat project={project} user={user} onMessage={handleMessage} messages={messages} members={teamMembers}/>
          
          <ConfirmationSnackbar
            open={snackbarOpen}
            onClose={() => setSnackbarOpen(false)}
            message={snackbarMessage}
            error={isError}
          />
        </div>
      </div>
    </DndContext>
  );
};

export default ProjectDashboard;
