import React, { useEffect, useState } from 'react'
import * as fetchData from "../utils/fetchData"

const ChatMessage = ( { message, senderProfileId, messageText, isOwnMessage, showHeader }) => {

  const [senderName, setSenderName] = useState('')
  const [senderPfp, setSenderPfp] = useState('/profile.png')

  useEffect(() => {
    const fetchSender = async () => {
      // fetch sender name
      const data = await fetchData.selectSingle("Users", "name, pfp", "profile_id", senderProfileId)
      setSenderName(data.name)
      setSenderPfp(data.pfp)
    }
    fetchSender()
  }, [])

  const formatTimestamp = (ts) => {
    const date = new Date(parseFloat(ts) * 1000);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    if (isToday) {
      return `Today ${timeStr}`;
    } else if (isYesterday) {
      return `Yesterday ${timeStr}`;
    } else {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year} ${timeStr}`;
    }
  };
  
  return (
    <div className={`flex justify-start ${showHeader ? 'mt-4' : ''}`}>
      <img className={`w-8 h-8 rounded-full ${!showHeader ? 'opacity-0' : ''}`} src={senderPfp}></img>
      <div className={`max-w-[75%] w-fit flex flex-col`}>
        {showHeader && (
          <div className={`flex items-center gap-2 text-xs px-3`}
          >
            <span className={'font-medium'}>{senderName}</span>
            <span className="text-foreground/50 text-xs">{formatTimestamp(message.ts)}</span> 
          </div>
        )}
        <div
          className={`px-3 text-sm max-w-full break-words whitespace-pre-wrap`}
        >
          {messageText}
        </div>
      </div>
    </div>
  )
}

export default ChatMessage