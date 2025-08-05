import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, X, Linkedin } from 'lucide-react';
import * as fetchData from "../../utils/fetchData";
import ChatBox from '../chatBox';
import { io } from 'socket.io-client';

const socket = io('https://elevat-ed.onrender.com'); // Replace with your server URL

const Chat = () => {
  const [selectedTab, setSelectedTab] = useState('Mentor');
  const tabs = ['Mentor', 'Everyone', 'Support Team'];
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...newFiles]);
  };
  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // fetch chat data
  const [user, setUser] = useState({})
  const [mentor, setMentor] = useState({})
  const [isMentorOpen, setIsMentorOpen] = useState(false);
  const [mentorChannelId, setMentorChannelId] = useState(null)
  const mentorChannelIdRef = useRef(null); // ✅ ref to avoid stale closure
  const [messages, setMessages] = useState([])

  useEffect(() => {
      const fetchChatData = async () => {
        // fetch USER
        const userId = await fetchData.getUserId()
        const user = await fetchData.selectSingle("Users", "*", "user_id", userId)
        setUser(user)

        // fetch MENTOR
        const mentor = await fetchData.selectSingle("Student_mentors", "*", "student_id", user.profile_id)
        setMentorChannelId(mentor.student_mentor_id)
        mentorChannelIdRef.current = mentor.student_mentor_id; // ✅ update ref
        console.log(`https://elevat-ed.onrender.com/slack/messages?channelName=mentor-${mentor.student_mentor_id}`)
        const mentorProfile = await fetchData.selectSingle("Mentors", "*", "mentor_id", mentor.mentor_id)
        const mentorUserProfile = await fetchData.selectSingle("Users", "*", "profile_id", mentorProfile.profile_id)
        setMentor({
          pfp: mentorUserProfile.pfp,
          name: mentorUserProfile.name,
          bio: mentorProfile.bio,
          expertise: mentorProfile.expertise
        })
        // fetch MENTOR MESSAGES
        try {
          const response = await fetch(`https://elevat-ed.onrender.com/slack/messages?channelName=mentor-${mentor.student_mentor_id}`);
          if (!response.ok) {
            throw new Error(`Error fetching messages: ${response.statusText}`);
          }
          const data = await response.json();
          setMessages(data.messages) // array of messages
        } catch (err) {
          console.error('Failed to fetch Slack messages:', err);
        }
      }
      fetchChatData()

      // listen to web socket events for new messages
      socket.on('new_message', (msg) => {
        console.log('web socket event detected, message: ', msg) 
        const id = msg.channel.split('-').pop(); 
        console.log(id, mentorChannelIdRef.current)
        if (id == mentorChannelIdRef.current) {
            setMessages(prev => [...prev, msg.message]); // update messages state with new messages
          }
      });

      return () => {
        socket.off('new_message');
      };
  }, [])

  // handle message send
  const handleMessage = async (messageText, profile_id) => {
    try {
      const response = await fetch('https://elevat-ed.onrender.com/slack/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: `mentor-${mentorChannelId}`,
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

  return (
    <div className='flex flex-col w-full h-full'>

      {/* <button onClick={async () => fetch('http://localhost:3000/slack/create-channel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ channelName: 'mentor-3' })
      }).then(response => response.json()).then(data => console.log(data)).catch(error => console.error(error))}>
        Create Channel
      </button> */}

      <div className='h-12 w-full'>
        <div className='flex items-end justify-start gap-4 bg-green-med-dark/5 border-b-2 border-b-green-med-dark/25 w-full h-full px-4 text-sm font-medium'>
          {tabs.map(tab => (
            <p
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`cursor-pointer pb-2 transition-all ${
                selectedTab === tab ? 'border-b-3 border-green-full text-green-full' : 'border-b-3 border-transparent'
              }`}
            >
              {tab}
            </p>
          ))}
          <button 
          className='outline-none text-green-full bg-white/95 px-2 py-1 border-2 border-green-med-dark/25 rounded-full ml-auto mb-1 hover:bg-green-full hover:text-white/95 transition-all'
          onClick={() => setIsOpen(true)}
          >Report an issue</button>
        </div>
      </div>

      {/* Popup Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/15">
          {/* Popup Box */}
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 relative">
            <button onClick={() => setIsOpen(false)} className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl">&times;</button>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report an issue
            </label>
            <textarea
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-full resize-none"
              placeholder="Enter your message..."
            />
            <label className="block mb-2 text-sm font-medium text-gray-700 cursor-pointer">
              <span className="flex items-center gap-2">
                Upload screenshots
                <Upload width={16} className="hover:opacity-75" />
              </span>
              <input
                type="file"
                accept=".pdf,image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* File Preview List */}
            {files.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {files.map((file, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between p-2 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {/* File Type Icon */}
                      {file.type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <FileText className="w-6 h-6 text-gray-500" />
                      )}

                      {/* File name */}
                      <span className="text-sm text-gray-800">{file.name}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* View button for PDFs */}
                      {file.type === "application/pdf" && (
                        <a
                          href={URL.createObjectURL(file)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm hover:underline"
                        >
                          View
                        </a>
                      )}

                      {/* Remove file */}
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className='text-sm text-gray-500'>No files to preview</p>}
            <button className="mt-4 bg-green-full text-white text-sm px-4 py-1 rounded-full hover:bg-green-full/75">
              Submit
            </button>
          </div>
        </div>
      )}

      {selectedTab == "Mentor" && <div className='relative h-full'>
          <div className={`flex justify-center items-center p-4 absolute bg-white top-4 right-10 rounded-xl border-green-light border-1 shadow-md hover:cursor-pointer hover:bg-gray-100 transition-all`}
          onClick={() => setIsMentorOpen(true)}>
            <img className={`w-12 h-12 rounded-full`} src={mentor.pfp ? mentor.pfp : '/profile.png'}></img>
            <div className={`flex flex-col items-start text-xs px-3 mb-1 gap-1`}>
              <span className={'font-medium'}>{mentor.name ? mentor.name : 'Username'}</span>
              <span className="text-gray-600 text-xs max-w-[24ch] line-clamp-2">{mentor.bio ? mentor.bio : 'Mentor bio'}</span> 
            </div>
          </div>
          <ChatBox user={user} onMessage={handleMessage} messages={messages}/>
        </div>}
      {selectedTab == "Everyone" && <ChatBox user={user} onMessage={handleMessage} messages={messages}/>}

      {/* Popup Overlay */}
        {isMentorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/15">
            {/* Popup Box */}
            <div className="bg-white rounded-lg shadow-xl max-w-md flex flex-col justify-start items-center w-full p-6 relative">
              <button onClick={() => setIsMentorOpen(false)} className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl">&times;</button>
              <img className={`w-24 h-24 rounded-full mb-2`} src={mentor.pfp}></img>
              <h3 className={'font-medium'}>{mentor.name}</h3>
              <p className='text-xs mb-4'>{mentor.expertise}</p>
              <span className="text-gray-600 text-xs">{mentor.bio ? mentor.bio : 'Mentor bio'}</span> 
            </div>
          </div>
        )}

    </div>
  );
};

export default Chat;
