import React, {useState, useRef, useEffect, useMemo} from 'react'
import BentoBoxSmall from '../bentoBoxSmall'
import BentoBoxLarge from '../bentoBoxLarge'
import BentoBoxMedium from '../bentoBoxMedium'
import Bar from '../bar'
import * as fetchData from "../../utils/fetchData"
import ProfilePopUp from "../profilePopUp";
import TaskCard from '../taskCard'
import ChatMessage from '../chatMessage'
import LoadingOverlay from '../ui/loadingOverlay'
import Popup from '../ui/popup'
import * as rewards from "../../utils/rewards"
import { useTour } from '@reactour/tour'

// const Event = ({event, date, start, end}) => {
//     return (
//       <div className='flex flex-col items-start border-l-4 border-green-full px-4 mb-4'>
//           <h1 className='font-medium text-lg'>{event}</h1>
//           <p className='text-sm text-green-med-dark'>{date}  {start} - {end}</p>
//       </div>
//     )
//   }

// const Task = ({task, deadline}) => {
//     return (
//         <div className='flex justify-start items-center gap-4 mb-4'>
//             <div className='w-4 h-4 border-2 border-green-full'></div>
//             <div>
//                 <h1 className='font-medium text-lg'>{task}</h1>
//                 <p className='text-sm text-green-med-dark'>{deadline}</p>
//             </div>
//         </div>
//     )
// }

// const Message = ({message, date, username, userpfp}) => {
//     return (
//         <div className='flex justify-start items-center gap-4 mb-4'>
//             <img className='w-8 h-8' src={userpfp}></img>
//             <div>
//                 <h1 className='font-medium text-sm'>{username} <span className='font-normal text-green-med-dark'>{date}</span></h1>
//                 <p className='text-sm text-green-med-dark max-w-full line-clamp-1'>{message}</p>
//             </div>
//         </div>
//     )
// }

const Home = ( { user } ) => {
    const [getStartedTasksPopup, setGetStartedTasksPopup] = useState(false)
    const { setCurrentStep, currentStep, setIsOpen } = useTour();
    const [completed, setCompleted] = useState(() => {
        const done = Array.isArray(user.get_started_tasks_complete) ? user.get_started_tasks_complete : [];
        return [1, 2, 3, 4].map(id => done.includes(id));
        });
    const [taskAnchor, setTaskAnchor] = useState(null);
    const tasks = rewards.getStartedTasks     

    const [isLoading, setIsLoading] = useState(true)
    const [users, setUsers] = useState([])
    const [usersToDisplay, setUsersToDisplay] = useState([])
    const userRef = useRef(null);
    const [columns, setColumns] = useState({ todo: [], inprogress: [] });

    const [mentorMessages, setMentorMessages] = useState([])
    const mentorChatContainerRef = React.useRef(null);
    const [messages, setMessages] = useState([])
    const chatContainerRef = React.useRef(null);
    const isToday = (timestamp) => {
        const msgDate = new Date(parseFloat(timestamp) * 1000);
        const now = new Date();
        
        return (
            msgDate.getDate() === now.getDate() &&
            msgDate.getMonth() === now.getMonth() &&
            msgDate.getFullYear() === now.getFullYear()
        );
    };
    const orderedMessages = useMemo(() => (
        messages.filter(msg => !('subtype' in msg) && isToday(msg.ts)).sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts))
    ), [messages]);
    // scroll messages down to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);
    
    const orderedMentorMessages = useMemo(() => (
        mentorMessages.filter(msg => !('subtype' in msg) && isToday(msg.ts)).sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts))
    ), [mentorMessages]);
    // scroll messages down to bottom
    useEffect(() => {
        if (mentorChatContainerRef.current) {
            mentorChatContainerRef.current.scrollTop = mentorChatContainerRef.current.scrollHeight;
        }
    }, [mentorMessages]);

    // FETCH DATA
    useEffect(() => {
    const fetchUserData = async () => {
        // fetch USERS
        const allUsers = await fetchData.select("Users", "*", "school", user.school, 'points', false)
        const allStudents = allUsers.filter(user => user.role == 'Student');
        setUsers(allStudents)
        setIsLoading(false)

        // fetch TASKS
        const projectMember = await fetchData.selectSingle("Project_members", "*", "profile_id", user.profile_id)
        const projectTasksData = await fetchData.select("Project_tasks", "*", "project_id", projectMember.project_id)
        const assignedTasks = await fetchData.select("Project_task_assignees", "*", "project_member_id", projectMember.project_member_id)
        const assignedTasksIds = assignedTasks.map(task => task.task_id);
        const filteredTasks = projectTasksData.filter(task => assignedTasksIds.includes(task.task_id))
        
        // Create a copy of the empty columns on component mount
        const updatedColumns = {
        todo: [],
        inprogress: [],
        };
        // Fill the correct arrays
        filteredTasks.forEach(task => {
        if (task.status in updatedColumns) { // prevent errors
            updatedColumns[task.status].push(task);
        }
        });
        // update state once
        console.log(updatedColumns)
        setColumns(updatedColumns);

        // fetch MESSAGES
        try {
        const response = await fetch(`https://elevat-ed.onrender.com/slack/messages?channelName=project-group-${projectMember.project_id}`);
        if (!response.ok) {
            throw new Error(`Error fetching messages: ${response.statusText}`);
        }
        const data = await response.json();
        setMessages(data.messages) // array of messages
        } catch (err) {
        console.error('Failed to fetch Slack messages:', err);
        }

        const student_mentor = await fetchData.selectSingle('Student_mentors', '*', 'student_id', user.profile_id)
        try {
        const response = await fetch(`https://elevat-ed.onrender.com/slack/messages?channelName=mentor-${student_mentor.student_mentor_id}`);
        if (!response.ok) {
            throw new Error(`Error fetching messages: ${response.statusText}`);
        }
        const data = await response.json();
        setMentorMessages(data.messages) // array of messages
        } catch (err) {
        console.error('Failed to fetch Slack messages:', err);
        }

        if ([1, 2, 3, 4].some(id => !user.get_started_tasks_complete?.includes(id))) setGetStartedTasksPopup(true)
    }
    fetchUserData()
    }, [])

    useEffect(() => {    
        // Find the index of the current user
        const currentUserIndex = users.findIndex(u => u.profile_id === user.profile_id);
        // Compute slice range
        let start = Math.max(currentUserIndex - 1, 0);
        let end = start + 3;

        // Handle bottom edge
        if (end > users.length) {
            end = users.length;
            start = Math.max(end - 3, 0);
        }

        setUsersToDisplay(users.slice(start, end))
        // if (userRef.current) {
        //   userRef.current.scrollIntoView({
        //     behavior: "smooth",
        //     block: "center",
        //   });
        // }
      }, [users]);

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

  return (
    <div className='flex gap-4 min-h-screen p-6 relative'>
        <LoadingOverlay full={false}/>
        <div className="flex flex-col text-green-dark">
            <p className='text-sm font-medium text-green-med-dark'>Hi {user.name}</p>
            <h1 className="text-2xl font-semibold mb-6">Welcome back,</h1>

            {/* Bento grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">

                <BentoBoxSmall upperText={"Login Streak"} lowerTextStat={"7"} lowerTextSub={"days"} rightIcon={'/clock.png'}/>
                <BentoBoxSmall upperText={"Tasks Completed"} lowerTextStat={"4"} lowerTextSub={"by you"} leftIcon={'/bar_chart.png'}/>
                <BentoBoxSmall upperText={"Tasks"} lowerTextStat={columns.todo.length + columns.inprogress.length} lowerTextSub={'to do'} leftIcon={'/opportunities.png'}/>
                <BentoBoxSmall upperText={"Project Cycle"} lowerTextStat={"10%"} lowerTextSub={"complete"} rightIcon={'/graph_curve.png'} hasGradient={true}/>
        
                {/* Project deets */}
                <div className='col-span-8 flex justify-evenly gap-8 items-center bg-green-light rounded-2xl p-8 h-auto'>
                    <div className='flex flex-col items-start justify-start w-1/2 h-full'>
                        <p className='text-sm font-semibold !text-green-med-dark/80'>Project Tasks</p>
                        <h1 className='text-xl font-semibold mb-2'>Assigned to You</h1>
                        <div className="w-full h-full grid grid-cols-2 gap-6">
                            {/* To Do Column */}
                            <div className="w-full">
                                <h2 className="text-md font-semibold mb-2">To Do</h2>
                                {columns.todo.length === 0 ? (
                                    <div className='w-full h-full flex flex-col items-center justify-center gap-2 text-sm mt-[-20px]'>
                                        <img className='w-10' src={'/check.png'}/>
                                        <p className="text-sm text-green-med-dark/70">No tasks to show</p>
                                    </div>
                                ) : (
                                <div className='max-h-[120px] flex flex-col gap-2 overflow-y-auto'>
                                    {columns.todo.map((task) => (
                                        <TaskCard task={task} isSmall={true}/>
                                    ))}
                                </div>
                                )}
                            </div>

                            {/* In Progress Column */}
                            <div className="w-full">
                                <h2 className="text-md font-semibold mb-2">In Progress</h2>
                                {columns.inprogress.length === 0 ? (
                                    <div className='w-full h-full flex flex-col items-center justify-center gap-2 text-sm mt-[-20px]'>
                                        <img className='w-10' src={'/check.png'}/>
                                        <p className="text-sm text-green-med-dark/70">No tasks to show</p>
                                    </div>
                                ) : (
                                <div className='max-h-[120px] flex flex-col gap-2 overflow-y-auto'>
                                    {columns.inprogress.map((task) => (
                                        <TaskCard task={task} isSmall={true}/>
                                    ))}
                                </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-col items-start justify-start w-1/2 h-full'> {/*here*/}
                        <p className='text-sm font-semibold !text-green-med-dark/80'>Team Chat</p>
                        <h1 className='text-xl font-semibold mb-4'>Recent Messages</h1>
                        <div ref={chatContainerRef} className="flex-1 w-full max-h-[140px] overflow-y-auto space-y-4 bg-white/70 p-4 rounded-2xl">
                            {orderedMessages.length === 0 ? (
                                <div className="text-center text-sm text-muted-foreground">
                                No new messages today!
                                </div>
                            ) : null}
                            <div className="flex flex-col pb-2">
                                {orderedMessages.map((message, index) => {
                                const match = message.text.match(/^\[(.+?)\]\s?(.*)$/);
                                if (match){
                                    const senderProfileId = match[1]
                                    const messageText = match[2]
                                    const prevMessage = index > 0 ? orderedMessages[index - 1] : null
                                    const prevMessageMatch = prevMessage ? prevMessage.text.match(/^\[(.+?)\]\s?(.*)$/) : null
                                    let ownMessageString = false
                                    if (prevMessageMatch) {
                                        ownMessageString = prevMessageMatch[1] == senderProfileId
                                    }
                                    const currentTime = parseFloat(message.ts);
                                    const prevTime = prevMessage ? parseFloat(prevMessage.ts) : null;
                                    const timeGap = prevTime !== null ? (currentTime - prevTime) / 60 : null; // in minutes
                                    // don't show header only if there is a previous message by the same user
                                    const showHeader = (prevMessage != null ? !ownMessageString : true) || (timeGap !== null && timeGap > 5)
                                    // const showHeader = true
                                    return (
                                        <div
                                        key={message.ts}
                                            className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                                        >
                                            <ChatMessage
                                            message={message}
                                            senderProfileId={senderProfileId}
                                            messageText={messageText}
                                            isOwnMessage={senderProfileId == user.profile_id}
                                            showHeader={showHeader}
                                            widthFull={false}
                                            />
                                        </div>
                                        )
                                } else {
                                    console.warn("No MATCH for message:", message);
                                }
                                })}
                                </div>
                            </div>                         
                    </div>
                </div>
            
                {/* Leaderboard */}
                {isLoading ? <p>loading...</p> : <div className='col-span-4 bg-green-light rounded-2xl p-8 h-auto'>
                        <h1 className='text-xl font-semibold mb-4'>Leaderboard</h1>
                        <div className='h-40 overflow-y-hidden'>
                            {usersToDisplay.map((otherUser, index) => (
                                <div
                                key={otherUser.name}
                                ref={otherUser.profile_id == user.profile_id ? userRef : null}
                                className={`flex items-center justify-between px-2 py-1 rounded-lg mb-1 ${
                                    otherUser.profile_id == user.profile_id ? "bg-green-full" : ""
                                }`}
                                >
                                <div className={`${otherUser.profile_id == user.profile_id  ? 'text-white/90 ': 'text-gray-600'} flex items-center gap-3`}>
                                    <span className={` font-medium w-5 text-right`}>{users.findIndex(u => u.profile_id === otherUser.profile_id) + 1}</span>
                                    <div
                                    className="w-10 h-10 rounded-full overflow-hidden"
                                    >
                                    <img src={otherUser.pfp ? otherUser.pfp : '/profile.png'} alt={otherUser.name} className="w-full h-full object-cover"/>
                                    </div>
                                    <span className="text-sm font-medium">{otherUser.profile_id == user.profile_id ? 'You' : otherUser.name}</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <img src='/points.png' width={20}></img>
                                    <span className={`${otherUser.profile_id == user.profile_id ? 'text-white/90 ': 'text-green-full'} font-semibold`}>{otherUser.points}</span>
                                </div>
                                </div>
                            ))}
                        </div>
                    </div>}

                {/* New Messages */}
                <div className='col-span-4 bg-green-light rounded-2xl p-8 h-auto'>
                    <h1 className='text-xl font-semibold mb-4'>Mentor Messages</h1>
                    <div ref={mentorChatContainerRef} className="flex-1 w-full max-h-[140px] overflow-y-auto space-y-4 bg-white/70 p-4 rounded-2xl">
                            {orderedMentorMessages.length === 0 ? (
                                <div className="text-center text-sm text-muted-foreground">
                                No new messages today!
                                </div>
                            ) : null}
                            <div className="flex flex-col pb-2">
                                {orderedMentorMessages.map((message, index) => {
                                const match = message.text.match(/^\[(.+?)\]\s?(.*)$/);
                                if (match){
                                    const senderProfileId = match[1]
                                    const messageText = match[2]
                                    const prevMessage = index > 0 ? orderedMessages[index - 1] : null
                                    const prevMessageMatch = prevMessage ? prevMessage.text.match(/^\[(.+?)\]\s?(.*)$/) : null
                                    let ownMessageString = false
                                    if (prevMessageMatch) {
                                        ownMessageString = prevMessageMatch[1] == senderProfileId
                                    }
                                    const currentTime = parseFloat(message.ts);
                                    const prevTime = prevMessage ? parseFloat(prevMessage.ts) : null;
                                    const timeGap = prevTime !== null ? (currentTime - prevTime) / 60 : null; // in minutes
                                    // don't show header only if there is a previous message by the same user
                                    const showHeader = (prevMessage != null ? !ownMessageString : true) || (timeGap !== null && timeGap > 5)
                                    // const showHeader = true
                                    return (
                                        <div
                                        key={message.ts}
                                            className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                                        >
                                            <ChatMessage
                                            message={message}
                                            senderProfileId={senderProfileId}
                                            messageText={messageText}
                                            isOwnMessage={senderProfileId == user.profile_id}
                                            showHeader={showHeader}
                                            widthFull={false}
                                            />
                                        </div>
                                        )
                                } else {
                                    console.warn("No MATCH for message:", message);
                                }
                                })}
                                </div>
                            </div>               
                    {/* <Message message={"Lorem ipsum dolor sit amet, consectetur ali..."} date={"Today, 16:36"} username={"Username"} userpfp={'/profile.png'}/>
                    <Message message={"Lorem ipsum dolor sit amet, consectetur ali..."} date={"Today, 16:36"} username={"Username"} userpfp={'/profile.png'}/>
                    <Message message={"Lorem ipsum dolor sit amet, consectetur ali..."} date={"Today, 16:36"} username={"Username"} userpfp={'/profile.png'}/> */}
                </div>

                {/* Upcoming Events */}
                <div className='col-span-4 bg-green-light rounded-2xl p-8 h-auto'>
                    <h1 className='text-xl font-semibold mb-4'>Upcoming Events</h1>
                    <div className='w-full h-full flex flex-col items-center justify-center gap-2 text-sm mt-[-20px]'>
                        <img className='w-12' src={'/calendar.png'}/>
                        <p>No upcoming events</p>
                    </div>
                </div>
        
                {/* New Messages */}
                <div className="col-span-4 bg-green-light rounded-2xl p-8 h-auto">
                      <h1 className='text-xl font-semibold mb-4'>Opportunity Tracker</h1>
                        <div className='flex items-center gap-4'> 
                            <div>
                                <p className='text-sm'>Discover valuable opportunities curated by our team to elevate your career.</p>
                                <button className="mt-4 bg-green-full text-sm text-white py-2 px-4 rounded-full hover:cursor-pointer" onClick={() => {
                                    const element = document.getElementById("trackr-page-btn");
                                    if (element) {
                                        element.click();
                                    } else {
                                        console.warn(`No element found with id: trackr-page-btn`);
                                    }
                                }}>Explore</button>
                            </div>
                            <img src='/trackr_screenshot.png' className='w-[50%]'></img>
                        </div>
                        
                    </div>

            </div>
        </div>

        {getStartedTasksPopup && <Popup setIsOpen={setGetStartedTasksPopup}>
            <h2 className="font-semibold text-lg pb-4 w-full border-b-2 border-green-med-dark/25">Getting Started</h2>
            <h3 className="font-semibold mb-1">Welcome {user.name}! 👋</h3>
            <p className='text-sm'>Here are some tasks to get you ahead of the game!</p>
            <div>
                <div className='w-full relative h-4 rounded-full bg-green-light overflow-hidden'>
                    <div className={`absolute left-0 top-0 h-full bg-green-full`}
                    style={{ width: `${completed.filter(t => t).length * 25}%` }}></div>
                </div>
                <p className='text-sm mt-2'>{completed.filter(t => t).length*25}% Completed - <span className='text-green-full'>{completed.filter(t => t).length === 0 ? 'Get Started!' : completed.filter(t => t).length < 3 ? 'Keep it up!' : 'Nice work!'}</span></p>
            </div>
            
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
                        setGetStartedTasksPopup(false)
                        }}
                    >
                        {task.action}
                    </button>
                    <span className='flex items-center text-sm !text-green-dark/80'>+{task.reward} <img className='h-6 w-6' src='/points.png'/></span>
                    </div>
                </div>
                ))}
            </div>
            </Popup>}
        
    </div>
  )
}

export default Home