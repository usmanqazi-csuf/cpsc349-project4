'use strict';

import * as helper from './helper.js'

let dm_list = []
let temp_key_list = []
let currentConvoUser = null
let latestMessageId = null
//const username = window.sessionStorage.getItem('username')
//const username = 'ProvAvery';
//const user_id = await helper.getUser(1)
//const current_user_id = 1

let loggedInUser = window.sessionStorage.getItem('user')
loggedInUser = JSON.parse(loggedInUser)
const username = loggedInUser.username
const current_user_id = loggedInUser.id

// Get the list of dms
// First get the sent list
// Help from: https://www.digitalocean.com/community/tutorials/how-to-use-the-javascript-fetch-api-to-get-data
export async function getdirectMessagesSent(url) {
  return await fetch(url)
    .then((response) => response.json())
    .then((data) => {
      for(let i = 0; i < data.resources.length; i++) {
        let key = data.resources[i].to_user_id
        data.resources[i].convo_key = key
        dm_list.push(data.resources[i])
      }
    })
    .catch(error => {
      console.log(error)
      return null
    })
}

// Get the received list
export async function getdirectMessagesReceived(url) {
  return await fetch(url)
    .then((response) => response.json())
    .then((data) => {
      for(let i = 0; i < data.resources.length; i++) {
        let key = data.resources[i].from_user_id
        data.resources[i].convo_key = key
        dm_list.push(data.resources[i])
      }
    })
    .catch(error => {
      console.log(error)
      return null
    })
}

// Run Functions finish the dm list promises
let url_sent = 'http://localhost:5000/direct_messages/?sort=timestamp&from_user_id=' + current_user_id
let url_from = 'http://localhost:5000/direct_messages/?sort=timestamp&to_user_id=' + current_user_id
await Promise.all([getdirectMessagesSent(url_sent), getdirectMessagesReceived(url_from)])

// Sort DM array by timestamp
helper.sortByTime(dm_list)

// Grab all the keys
function getKeys() {
  for(let i = 0; i < dm_list.length; i++) {
    let key = dm_list[i].convo_key
    if(!(temp_key_list.includes(key)))
    temp_key_list.push(key)
  }
}

// To do: Post direct message 
// Registration
export async function createDM (new_from_user_id, new_to_user_id, new_in_reply_to_id, new_text) {
  let url = 'http://localhost:5000/direct_messages'

  return fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      from_user_id: new_from_user_id,
      to_user_id: new_to_user_id,
      in_reply_to_id: new_in_reply_to_id,
      text: new_text
    }),
    headers: new Headers()
  })
  .then((response) => response.json())
  .then((data) => {
    return data
  })
  .catch(error => {
    console.log(error)
    return null
  })
}

async function directMessage () {
  const new_from_user_id = loggedInUser.id
  const new_to_user_id = currentConvoUser
  const new_in_reply_to_id = latestMessageId
  const new_text = document.getElementById('new-message-text').value
  await createDM(new_from_user_id, new_to_user_id, new_in_reply_to_id, new_text)
}

document.getElementById('send-message-button').addEventListener('click', async () => {
  await directMessage()
  dm_list = []
  await Promise.all([getdirectMessagesSent(url_sent), getdirectMessagesReceived(url_from)])
  helper.sortByTime(dm_list)
  displayMessages(currentConvoUser)
  document.getElementById('new-message-text').value = ''
  temp_key_list = []
  await getKeys()
  await displayConvoList()
  selectUser()
})

// Display convo list
async function displayConvoList() {
  console.log(temp_key_list)
  document.getElementById('user-dm-list').innerHTML = ''
  if(temp_key_list !== null) {
    for(let i = 0; i < temp_key_list.length; i++) {
      const result = await helper.getUser(temp_key_list[i])
      const dmPost = document.createElement('div')
      dmPost.className = "flex flex-row justify-center items-center border-b-2"
      
      dmPost.innerHTML += "<button id='" + result.id + "' class='conversation-tab w-full py-4 px-2 text-lg font-semibold text-black"
      + " hover:bg-gray-200 transition duration-300'>" + result.username + "</button>"
      
      document.getElementById('user-dm-list').append(dmPost)
    }
  }
}

// Create divs for each message and display them on the page
export async function displayMessages(convo_key) {
  document.getElementById('messages').innerHTML = ''
  if (dm_list !== null) {
    const dmPost = document.createElement('div')
    dmPost.className = "array flex flex-col my-5"
    console.log(currentConvoUser)
    let convoUser = await helper.getUser(currentConvoUser)
    convoUser = convoUser.username
    console.log(username)
    dmPost.innerHTML += "<h2 class='text-black'>" + convoUser + "</h2>"
    for(let i = 0; i < dm_list.length; i++) {
      const result = await dm_list[i]
      

      if (dm_list[i].from_user_id === current_user_id && dm_list[i].convo_key === convo_key) {
        latestMessageId = result.id
        dmPost.innerHTML += "<div class='my-2 mr-2 py-3 px-4 bg-blue-400 rounded-bl-3xl rounded-tl-3xl rounded-tr-xl text-white break-words'>" + result.text + "</div>"
      }
      else if(dm_list[i].to_user_id === current_user_id && dm_list[i].convo_key === convo_key) {
        latestMessageId = result.id
        dmPost.innerHTML += "<div class='my-2 ml-2 py-3 px-4 bg-gray-400 rounded-br-3xl rounded-tr-3xl rounded-tl-xl text-white break-words'>" + result.text  + "</div>"
      }

      document.getElementById('messages').append(dmPost)
    }
  }
}

async function selectUser() {
  let conversations = document.getElementsByClassName('conversation-tab')
  for (let i = 0; i < conversations.length; i++) {
    conversations[i].addEventListener('click', async () => {
      document.getElementById('new-message-area').classList.remove('hidden')
      currentConvoUser = parseInt(conversations[i].getAttribute('id'))
      await displayMessages(currentConvoUser)
    })
  }
}

let newConversationButton = document.getElementById('new-conversation-button')
let dropdownArea = document.getElementById('dropdown-area')
newConversationButton.addEventListener('click', () => {
  if (newConversationButton.innerHTML === 'X') {
    newConversationButton.innerHTML = 'New Conversation'
  } else {
    newConversationButton.innerHTML = 'X'
  }
  dropdownArea.classList.toggle('hidden')
})

let dropdown = document.getElementById('new-conversation-dropdown')
let startNewConversationButton = document.getElementById('start-new-conversation-button')
startNewConversationButton.addEventListener('click', async () => {
  document.getElementById('new-message-area').classList.remove('hidden')
  let convoUser = await helper.getUser(dropdown.value)
  currentConvoUser = convoUser.id
  displayMessages(convoUser.id)
  dropdownArea.classList.toggle('hidden')
  newConversationButton.innerHTML = 'New Conversation'
})

async function generateConversationDropdown(){
  let followArr = await helper.getFollowing(loggedInUser)
  if (followArr.length === 0) {
    let message = '<h3 class="text-black font-bold justify-center items-center text-center">'
    + 'Find people to follow on the <a class="text-blue-900 underline hover:text-blue-500" href="public_timeline.html">public timeline!</a></h3>'
    document.getElementById('convo-container').classList.remove('justify-between')
    document.getElementById('convo-container').classList.add('justify-center')
    document.getElementById('messages').innerHTML = message
  }
  const dropdownMenu = document.getElementById('new-conversation-dropdown')
  
  for (let i = 0; i < followArr.length; i++) {
    let followedUser = await helper.getUser(followArr[i].following_id)
    dropdown.innerHTML+='<option value="'+followedUser.username+'">'+ followedUser.username+'</option>'
  } 
}

await getKeys()
await displayConvoList()
selectUser()
generateConversationDropdown()