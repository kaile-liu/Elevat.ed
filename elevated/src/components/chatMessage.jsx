import React, { useEffect, useState } from 'react'
import * as fetchData from "../utils/fetchData"

const ChatMessage = ({ message, senderProfileId, messageText, isOwnMessage, showHeader, widthFull }) => {
  const [senderName, setSenderName] = useState('')
  const [senderPfp, setSenderPfp] = useState('/profile.png')

  useEffect(() => {
    const fetchSender = async () => {
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

    if (isToday) return `Today ${timeStr}`;
    if (isYesterday) return `Yesterday ${timeStr}`;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year} ${timeStr}`;
  };

  const parseMessage = (text) => {
    let [mainText, attachmentPart] = text.split('::attachments::');
    if (attachmentPart) {
      const attachments = attachmentPart.replace(/^\[|\]$/g, '').split(', ');
      return { mainText: mainText?.trim() ?? '', attachments };
    }

    return { mainText: mainText?.trim() ?? '', attachments: [] };
  }

  const { mainText, attachments } = parseMessage(messageText);

  return (
    <div className={`flex justify-start ${showHeader ? 'mt-2' : ''}`}>
      <img className={`w-8 h-8 rounded-full object-cover ${!showHeader ? 'opacity-0' : ''}`} src={senderPfp ? senderPfp : '/profile.png'} />
      <div className={`${widthFull ? '' : 'max-w-[28ch]'} w-fit flex flex-col`}>
        {showHeader && (
          <div className="flex flex-col items-start text-xs px-3 mb-1">
            <span className="font-medium">{senderName || 'User name'}</span>
            <span className="text-gray-600 text-xs">{formatTimestamp(message.ts)}</span>
          </div>
        )}
        <div className={`px-3 text-sm max-w-full break-words whitespace-pre-wrap ${showHeader && 'mb-2'}`}>
          {mainText.split(/(@[a-zA-Z0-9_]+)/g).map((part, idx) => {
            if (part.startsWith('@')) {
              return (
                <span key={idx} className="text-blue-600 font-medium">
                  {part}
                </span>
              );
            } else {
              return <span key={idx}>{part}</span>;
            }
          })}
        </div>
        {attachments != [] && (
          <div className="flex flex-wrap gap-2 px-3 mt-1">
            {attachments.filter(attachment => attachment != '').map((link, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className={`${widthFull ? '' : 'max-w-[24ch]'} text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:underline`}
              >
                {link.length > 24 ? link.slice(0, 24) + '…' : link}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatMessage
