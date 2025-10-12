import Slack from '@slack/bolt'
import express from 'express'
import dotenv from 'dotenv'
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors'

dotenv.config()

// EXPRESS APP
const app = express()
app.use(express.json())
app.use(cors());

// SLACK APP
const slackApp = new Slack.App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN,
})

// WEB SOCKET
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});
io.on('connection', socket => {
  console.log('Client connected to socket');
});


// Route 1: Create a new Slack channel for a specific project
app.post('/slack/create-channel', async (req, res) => {
    console.log('endpoint 1: /slack/create-channels')
    const { channelName } = req.body
    console.log(channelName)
  
    if (!channelName) {
      return res.status(400).json({ error: 'Missing channelName' })
    }
  
    //const channelName = `project-group-${project_id}`
    try {
      const createRes = await slackApp.client.conversations.create({
        name: channelName,
        is_private: false,
      })
      await slackApp.client.conversations.join({ channel: channelName });

      return res.json({
        message: `Channel ${channelName} created successfully.`,
        // channelId,
      })
    } catch (err) {
      console.error('Error creating channel:', err)
      return res.status(500).json({ error: 'Failed to create channel' })
    }
  })  


// Route 2: Send a message to a specific project channel
app.post('/slack/send-message', async (req, res) => {
    console.log('endpoint 2: /slack/send-message')
    const { channel, text, profile_id } = req.body
   
    if (!channel || !text) {
      return res.status(400).json({ error: 'Missing channel or text' })
    }
  
    try {
      const result = await slackApp.client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: channel,
        text: `[${profile_id}] ${text}`, 
      })

      // EMIT a web socket event
      io.emit('new_message', {
        channel,
        message: result.message,
      });
      console.log("Emitted web socket event: 'new_message'")

      return res.json({ message: 'Message sent successfully.' })
    } catch (err) {
      console.error('Error sending message:', err)
      return res.status(500).json({ error: 'Failed to send message' })
    }
  })
  
// Route 3: Get all messages from a project's channel
app.get('/slack/messages', async (req, res) => {
    console.log('endpoint 3: /slack/messages')
    const { channelName } = req.query // USAGE: GET /slack/messages?channelName=project-group-123
    console.log(channelName, 'channel')
    if (!channelName) {
      return res.status(400).json({ error: 'Missing channel name in query' })
    }
    // const channelName = `project-group-${project_id}`

    try {
      // Call the conversations.list method using the built-in WebClient
      const result = await slackApp.client.conversations.list({
        token: process.env.SLACK_BOT_TOKEN
      });
      console.log('channels found: ')

      // find the right channel
      for (const channel of result.channels) {
        console.log(channel.name)
        if (channel.name === channelName) {
          // Print result
          console.log("Found conversation ID: " + channel.id);
          console.log('fetching messages...')
          // fetch message history from this channel
          try {
            const result = await slackApp.client.conversations.history({
              channel: channel.id,
            })
            console.log('fetched all messages:')
            return res.json({ messages: result.messages })
          } catch (err) {
            console.error('Error retrieving messages:', err)
            return res.status(500).json({ error: 'Failed to retrieve messages' })
          }
        }
      }

      return res.status(400).json({ error: 'Cannot find Channel ID' })
    }
    catch (error) {
      console.error('error finding channel: ', error);
    }
  })

// Start the server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




// test
// async function test() {
//     const project_id = "3"
//     const text = "just a test message"

//     const channelName = `project-group-${project_id}`
//     try {
//       await slackApp.client.chat.postMessage({
//         token: process.env.SLACK_BOT_TOKEN,
//         channel: `project-group-${project_id}`,
//         text,
//       })
  
//       console.log({ message: 'Message sent successfully.' })
//     } catch (err) {
//       console.error('Error sending message:', err)
//     }
// }

// test()