import React, {useEffect, useState, useRef, useCallback, useMemo} from 'react'
import { SendHorizontal, Paperclip } from 'lucide-react';
import { supabase } from '../integrations/supabase/client'
import * as fetchData from "../utils/fetchData"
import * as notifications from "../utils/notifications"
// import { useRealtimeChat } from '../integrations/supabase/use-realtime-chat'
import ChatMessage from './chatMessage';
import LoadingOverlay from './ui/loadingOverlay';

const ProjectChat = ( { project, user, onMessage, messages, members }) => {

    const [newMessage, setNewMessage] = useState('')
    const chatContainerRef = React.useRef(null);

    const [attachments, setAttachments] = useState([]);
    const [showLinkPopover, setShowLinkPopover] = useState(false);
    const [linkInput, setLinkInput] = useState('');
    const linkInputRef = useRef(null);

    const [tagQuery, setTagQuery] = useState('');
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);
    const [caretPosition, setCaretPosition] = useState(0);
    const [taggedUsers, setTaggedUsers] = useState([]);
    const inputRef = useRef(null);

    // Filter members based on typed tag
    const filteredMembers = useMemo(() => {
      return tagQuery
        ? members.filter(member =>
            member.profile.name.toLowerCase().includes(tagQuery.toLowerCase())
          )
        : [];
    }, [tagQuery, members]);

    // Handle typing in the message box
    const handleInputChange = (e) => {
      const value = e.target.value;
      setNewMessage(value);

      const caretPos = e.target.selectionStart;
      const textUntilCaret = value.slice(0, caretPos);
      const atMatch = textUntilCaret.match(/@([a-zA-Z0-9_]{0,})$/);

      if (atMatch) {
        setTagQuery(atMatch[1]);
        setCaretPosition(caretPos);
        setShowTagSuggestions(true);
      } else {
        setShowTagSuggestions(false);
        setTagQuery('');
      }
    };

    // Replace @text with full tag
    const handleSelectUser = (user) => {
      setTaggedUsers(prevUsers => [...prevUsers, user.profile])
      const newText = newMessage.replace(/@([a-zA-Z0-9_]{1,})$/, `@${user.profile.name.replace(/\s+/g, '')}`);
      setNewMessage(newText);
      setShowTagSuggestions(false);
      setTagQuery('');
      inputRef.current?.focus();
    };

    const notifyTaggedUsers = async () => {
      taggedUsers.forEach(user => {
        notifications.createNotification(user.profile_id, `${user.name} mentioned you in a message`, newMessage.split(0, 20), `https://txgfvqffljglhgfwrwxn.supabase.co/storage/v1/object/public/ngo-logos//${project.ngo_logo}.png`, "project-page-btn")
      })
    };


    // scroll messages down to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const orderedMessages = useMemo(() => (
      messages.filter(msg => !('subtype' in msg)).sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts))
    ), [messages]);

    // send new message
    const handleSendMessage = (e) => {
        e.preventDefault()
        if (newMessage.length > 0) {
          onMessage(newMessage, attachments, user.profile_id) // call message handler, passing in message text and profile_id
          setNewMessage('') // reset new message state
          setAttachments([])
          notifyTaggedUsers()
        }
    }

    const handlePaperclipClick = (e) => {
      e.preventDefault();
      setShowLinkPopover(true);
      setTimeout(() => {
        if (linkInputRef.current) linkInputRef.current.focus();
      }, 0);
    };

    const handleLinkSubmit = (e) => {
      e.preventDefault();
      if (!linkInput) return;

      let url = linkInput.trim();

      if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }

      try {
        new URL(url); // validate
        setAttachments(prev => [...prev, url]);
        setLinkInput('');
        setShowLinkPopover(false);
      } catch (err) {
        alert('Invalid link. Please enter a valid URL.');
      }
    };

    // Remove one attachment
    const removeAttachment = (urlToRemove) => {
      setAttachments(prev => prev.filter(url => url !== urlToRemove));
    };


  return (
    <div className="flex flex-col max-h-[75vh] h-full w-full bg-white p-4 rounded-xl shadow relative">
     <LoadingOverlay full={false}/>
     {/* Messages */}
     <h3 className="font-semibold text-center mb-2">Team chat</h3>
     <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4">
       {messages.length === 0 ? (
         <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <img className='w-8 h-8' src='/chat.png'/>
           No messages yet. Start the conversation!
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
                      widthFull={true}
                    />
                  </div>
                )
           } else {
              console.warn("No MATCH for message:", message);
           }
          })}
        </div>
      </div> 

      {showLinkPopover && (
      <form
        onSubmit={handleLinkSubmit}
        className="flex items-center gap-2 p-2 border rounded-md shadow bg-white mb-2"
      >
        <input
          ref={linkInputRef}
          type="url"
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          placeholder="Paste link here..."
          className="border px-2 py-1 text-sm w-full rounded focus:outline-none"
        />
        <button
          type="submit"
          className="text-sm text-green-full font-medium hover:underline"
        >
          Add
        </button>
        <button
          type="button"
          className="text-sm text-gray-500 hover:text-red-500"
          onClick={() => setShowLinkPopover(false)}
        >
          Cancel
        </button>
      </form>
    )}

    {attachments.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-2">
        {attachments.map((url, index) => (
          <div key={index} className="bg-green-full/15 text-green-full px-3 py-1 rounded-full text-xs flex items-center space-x-2">
            <span className="truncate max-w-[150px]">{url.replace(/^https?:\/\//, '')}</span>
            <button
              onClick={() => removeAttachment(url)}
              className="text-red-500 hover:text-red-700 text-xs ml-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    )}

      <form onSubmit={handleSendMessage} className="flex w-full gap-2 border-t-2 border-green-med-dark/30 p-4">
        <input
          ref={inputRef}
          className={`bg-background text-sm focus:outline-none transition-all duration-300 w-full`}
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          placeholder="Type a message..."
        />
        <button
            className="aspect-square rounded-full"
            type="submit"
            onClick={handlePaperclipClick}
          >
            <Paperclip className="size-4 opacity-85 cursor-pointer hover:opacity-50"/>
          </button>
        <button
            className="aspect-square rounded-full"
            type="submit"
          >
            <SendHorizontal className="size-4 opacity-85 cursor-pointer hover:opacity-50"/>
          </button>
      </form>

      {showTagSuggestions && (
        <div className="absolute bottom-16 left-4 z-10 bg-green-light border-2 border-green-med-dark/25 rounded shadow w-48 max-h-40 overflow-y-auto text-sm">
          {filteredMembers.length == 0 && <p className='px-2 py-1'>No matches found</p>}
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="cursor-pointer px-2 py-1 hover:bg-green-full hover:text-white transition-all"
              onClick={() => handleSelectUser(member)}
            >
              <p>{member.profile.name}</p>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

export default ProjectChat