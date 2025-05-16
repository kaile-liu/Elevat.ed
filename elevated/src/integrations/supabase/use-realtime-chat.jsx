import { supabase } from './client'
import * as fetchData from "../../utils/fetchData"
import { useCallback, useEffect, useState } from 'react'
import { UserIcon } from 'lucide-react'

const EVENT_MESSAGE_TYPE = 'message'

export function useRealtimeChat({ roomName, username, project }) {
  const [messages, setMessages] = useState([])
  const [channel, setChannel] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const newChannel = supabase.channel(roomName)

    newChannel
      .on('broadcast', { event: EVENT_MESSAGE_TYPE }, (payload) => {
        setMessages((current) => [...current, payload.payload])
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        }
      })

    setChannel(newChannel)

    return () => {
      supabase.removeChannel(newChannel)
    }
  }, [roomName, username, supabase])

  const sendMessage = useCallback(
    async (content) => {
      if (!channel || !isConnected) return

      const userId = await fetchData.getUserId()
      const profileId = await fetchData.getProfileId(userId)
      const { data, error } = await supabase
        .from('Project_members')
        .select('project_member_id')
        .eq('profile_id', profileId)
        .eq('project_id', project.project_id)
        .single()
      if (error) throw error

      const message = {
        id: crypto.randomUUID(),
        content,
        user: {
          member_id: data.project_member_id,
          sender_name: username,
        },
        sent_at: new Date().toISOString(),
      }

      // Update local state immediately for the sender
      setMessages((current) => [...current, message])

      await channel.send({
        type: 'broadcast',
        event: EVENT_MESSAGE_TYPE,
        payload: message,
      })
    },
    [channel, isConnected, username]
  )

  return { messages, sendMessage, isConnected }
}