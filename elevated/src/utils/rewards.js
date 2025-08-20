import * as fetchData from "./fetchData"

export const getStartedTasks = [
    { id: 1, label: "Take the portal tour 🗺️", action:"Start", reward: 50 },
    { id: 2, label: "Say hi in project group chat 👋", action:"Chat", reward: 50 },
    { id: 3, label: "Say hi to your mentor 👋", action:"Chat", reward: 50 },
    { id: 4, label: "Visit the training program 🎓", action:"Visit", reward: 50 },
  ];

export const reward = async ( user, points ) => {
  const newPoints = user.points + points
  await fetchData.update(
    "Users",
    { points: newPoints },
    "profile_id",
    user.profile_id
  );
}