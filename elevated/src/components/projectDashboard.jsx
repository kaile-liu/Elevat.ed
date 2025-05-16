import React from 'react';
import { DndContext } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { SquarePen } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as fetchData from "../utils/fetchData"
import CreateTaskPopup from './createTaskPopup';
import TaskCard from './taskCard';
import ProjectChat from './projectChat';
import { supabase } from '../integrations/supabase/client';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000'); // Replace with your server URL

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
    <div ref={setNodeRef} className="bg-green-light rounded-lg p-3 min-h-[200px]">
      <h4 className={`font-semibold text-sm mb-2 text-${color}-600`}>
        • {title} <span className="text-gray-500">({count})</span>
      </h4>
      {children}
    </div>
  );
};

const ProjectDashboard = ( { project } ) => {
  // store project states below
  const [user, setUser] = useState({})
  const [teamMembers, setTeamMembers] = useState([])
  const [messages, setMessages] = useState([])
  const [openPopup, setOpenPopup] = useState(false)
  // task stored here in lists
  const [columns, setColumns] = React.useState({
    todo: [],
    inprogress: [],
    done: [],
  });

  // send messgae to Slack Channel via the '/slack/send-message' endpoint
  const handleMessage = async (messageText, profile_id) => {
    try {
      const response = await fetch('http://localhost:3000/slack/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: project.project_id,
          text: messageText,
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
      const userId = await fetchData.getUserId()
      const user = await fetchData.selectSingle("Users", "*", "user_id", userId)
      setUser(user)

      // fetch MEMBERS
      const teamMembers = await fetchData.select("Project_members", "*", "project_id", project.project_id)
      const memberProfiles = await Promise.all(teamMembers.map(async (member) => ({
        member: member,
        profile: await fetchData.selectSingle("Users", "*", "profile_id", member.profile_id),
      })))
      console.log(memberProfiles)
      setTeamMembers(memberProfiles)

      // fetch TASKS
      const projectTasksData = await fetchData.select("Project_tasks", "*", "project_id", project.project_id)
      console.log(projectTasksData)
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
        const response = await fetch(`http://localhost:3000/slack/messages?project_id=${project.project_id}`);
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
      console.log('web socket event detected, message: ', msg)  
      if (msg.project_id === project.project_id) {
          setMessages(prev => [...prev, msg.message]); // update messages state with new messages
        }
    });

    return () => {
      socket.off('new_message');
    };
  }, [])

  const handleDragEnd = ({ active, over }) => {
    if (!over) return;

    const sourceCol = Object.keys(columns).find((colId) =>
      columns[colId].some((task) => task.task_id === active.id)
    );

    const destinationCol = over.id;

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
        console.log('status destination: ', destinationCol, 'for task: ', active.id)
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

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col md:flex-row gap-6 h-screen max-h-screen">
        {openPopup && <CreateTaskPopup onClose={() => setOpenPopup(false)} teamMembers={teamMembers} project={project} setColumns={setColumns}
          />}
        {/* Left Section */}
        <div className="flex-1 flex flex-col relative max-h-[90vh]">
          {/* Project Info */}
          <button className="absolute top-4 right-4 text-white bg-green-full p-1 rounded-md hover:bg-green-full/75">
                <SquarePen size={16} />
          </button>
          <div className="bg-white p-4 rounded-xl shadow mb-6">
            <h2 className="text-xl font-semibold">
              {project.project_name}
            </h2>
            <p className="text-sm mt-1"><strong>NGO:</strong> {project.project_ngo}</p>
            <p className="mt-2 text-sm text-gray-700">
              <strong>Description:</strong> {project.project_description}
            </p>
            <p className="mt-2 text-sm">
              <strong>Upcoming deadline:</strong> Mid-term presentation <span className="text-green-full font-semibold">due 25/05/25</span>
            </p>
          </div>

          {/* Tasks Section */}
          <div className="bg-white p-4 rounded-xl shadow flex-1 flex flex-col max-h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Project Tasks</h3>
              <button className="bg-green-full text-white text-sm px-4 py-1 rounded-full hover:bg-green-full/75" onClick={() => setOpenPopup(true)}>Create Task +</button>
            </div>

            <div className="grid md:grid-cols-3 gap-2 flex-1 max-h-full">
              {['todo', 'inprogress', 'done'].map((columnId) => {
                const columnTitle = {
                  todo: 'To Do',
                  inprogress: 'In Progress',
                  done: 'Done',
                }[columnId];

                const columnColor = {
                  todo: 'blue',
                  inprogress: 'yellow',
                  done: 'green',
                }[columnId];

                return (
                  <DroppableColumn
                    key={columnId}
                    id={columnId}
                    title={columnTitle}
                    count={columns[columnId].length}
                    color={columnColor}
                    className='overflow-y-auto'
                  >
                    {columns[columnId].map((task) => (
                      <TaskCard task={task}/>
                    ))}
                  </DroppableColumn>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Section: Team + Chat */}
        <div className="w-full md:w-[300px] flex flex-col h-fill gap-6">
          {/* Team */}
          <div className="bg-white p-4 rounded-xl shadow">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Team members</h3>
              <button className="text-sm text-lime-600 font-semibold hover:underline">+ Invite</button>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((i) => (
                <img
                  key={i}
                  src={`https://randomuser.me/api/portraits/thumb/men/${i}.jpg`}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full border-2 border-white -ml-2 first:ml-0"
                />
              ))}
              <div className="text-sm bg-lime-100 text-lime-700 rounded-full px-2 py-0.5 ml-2">+1</div>
              <span className="text-sm text-gray-600 ml-1">See all</span>
            </div>
          </div>

          {/* Chat */}
          <ProjectChat project={project} user={user} onMessage={handleMessage} messages={messages}/>
          
        </div>
      </div>
    </DndContext>
  );
};

export default ProjectDashboard;
