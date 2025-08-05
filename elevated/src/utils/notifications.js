import * as fetchData from "./fetchData"

export const createNotification = async ( profile_id, title, preview, icon, action) => {
    action ?
    await fetchData.insert('Notifications', {
        profile_id: profile_id,
        title: title,
        preview: preview,
        icon: icon,
        action: action
    }) :
    await fetchData.insert('Notifications', {
        profile_id: profile_id,
        title: title,
        preview: preview,
        icon: icon
    }) 
}