import React, {useEffect, useState, useRef, useCallback, useMemo} from 'react'
import { SendHorizontal, Paperclip } from 'lucide-react';
import { supabase } from '../integrations/supabase/client'
import * as fetchData from "../utils/fetchData"
// import { useRealtimeChat } from '../integrations/supabase/use-realtime-chat'
import ChatMessage from './chatMessage';

const ProjectChat = ( { project, user, onMessage, messages }) => {

    const [newMessage, setNewMessage] = useState('')
    const chatContainerRef = React.useRef(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
        console.log('new messages added: ', messages.filter(msg => !('subtype' in msg)).sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts)))
    }, [messages]);

    const orderedMessages = useMemo(() => (
      messages.filter(msg => !('subtype' in msg)).sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts))
    ), [messages]);

    // send new message
    const handleSendMessage = (e) => {
        e.preventDefault()
        onMessage(newMessage, user.profile_id) // call message handler, passing in message text and profile_id
        setNewMessage('') // reset new message state
    }

  return (
    <div className="flex flex-col max-h-[75vh] h-full w-full bg-white p-4 rounded-xl shadow">
     {/* Messages */}
     <h3 className="font-semibold">Team chat</h3>
     <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4">
       {messages.length === 0 ? (
         <div className="text-center text-sm text-muted-foreground">
           No messages yet. Start the conversation!
         </div>
       ) : null}
       <div className="flex flex-col">
         {orderedMessages.map((message, index) => {
            //  if (message.subtype){
            //     return
            //  }
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
                    />
                  </div>
                )
           } else {
              console.warn("No MATCH for message:", message);
           }
          })}
        </div>
      </div>

      <form onSubmit={handleSendMessage} className="flex w-full gap-2 border-t border-green-med-dark/30 p-4">
        <input
          className={`bg-background text-sm focus:outline-none transition-all duration-300 w-full`}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button
            className="aspect-square rounded-full"
            type="submit"
          >
            <Paperclip className="size-4 opacity-85" />
          </button>
        <button
            className="aspect-square rounded-full"
            type="submit"
          >
            <SendHorizontal className="size-4 opacity-85" />
          </button>
      </form>
    </div>
  )
}

export default ProjectChat