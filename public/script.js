const socket = io();
let currentRoom;
let typingTimeout;

document.getElementById('leaveRoomButton').style.display = 'none';

function startChat() {
  const username = document.getElementById('username').value;
  if (username.trim() === '') {
    return;
  }

  socket.emit('setUsername', username);

  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('chatScreen').style.display = 'block';

  updateRoomList([]);

  const createRoomButton = document.createElement('button');
  createRoomButton.id = 'createRoom';
  createRoomButton.innerText = 'Create Room';
  createRoomButton.onclick = () => {
    const roomName = prompt('Enter room name:');
    if (roomName) {
      socket.emit('createRoom', roomName);
    }
  };

  document.getElementById('roomList').appendChild(createRoomButton);

  socket.on('updateRooms', (roomNames) => {
    updateRoomList(roomNames);
  });
}

function updateRoomList(roomNames) {
  const roomList = document.getElementById('roomList');
  roomList.innerHTML = 'Rooms: ';

  if (roomNames.length === 0) {
    roomList.innerHTML += 'No rooms available.';
  } else {
    roomNames.forEach(roomName => {
      const roomLink = document.createElement('a');
      roomLink.href = `#${roomName}`;
      roomLink.innerText = roomName;
      roomLink.onclick = () => {
        joinRoom(roomName);
      };
      roomList.appendChild(roomLink);
    });
  }
}

function joinRoom(roomName) {
  if (roomName === currentRoom) {
    return;
  }

  socket.emit('joinRoom', roomName);
  currentRoom = roomName;

  const chat = document.getElementById('chat');
  chat.innerHTML = '';

  socket.off('receiveMessage');
  socket.off('userTyping');

  socket.on('receiveMessage', (data) => {
    displayMessage(data);
  });

  socket.on('userTyping', (username) => {
    document.getElementById('typingIndicator').innerText = `${username} is typing...`;
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      document.getElementById('typingIndicator').innerText = '';
    }, 3000);
  });

  const roomLinks = document.querySelectorAll('#roomList a');
  roomLinks.forEach(link => {
    link.classList.remove('active');
  });
  const activeLink = document.querySelector(`#roomList a[href="#${roomName}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }

  const leaveRoomButton = document.getElementById('leaveRoomButton');
  leaveRoomButton.style.display = 'block';
}

function leaveRoom() {
  if (currentRoom !== '') {
    socket.emit('leaveRoom', currentRoom);
    const activeLink = document.querySelector(`#roomList a[href="#${currentRoom}"]`);
    if (activeLink) {
      activeLink.classList.remove('active');
    }
    currentRoom = '';
    const chat = document.getElementById('chat');
    chat.innerHTML = '';
    document.getElementById('leaveRoomButton').style.display = 'none';
  }
}

function sendMessage() {
  const message = document.getElementById('message').value;
  if (message.trim() === '') {
    return;
  }

  socket.emit('sendMessage', {
    room: currentRoom,
    message: message
  });

  document.getElementById('message').value = '';
  document.getElementById('typingIndicator').innerText = '';
}

function displayMessage(data) {
  const chat = document.getElementById('chat');
  const messageElement = document.createElement('p');

  // Apply appropriate class based on the sender
  messageElement.className = data.username === socket.username ? 'sent-message' : 'received-message';

  messageElement.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
  chat.appendChild(messageElement);
  chat.scrollTop = chat.scrollHeight;
}

document.getElementById('message').addEventListener('input', () => {
  socket.emit('typing', currentRoom);
});

// Listen for Enter key press in the message input field
document.getElementById('message').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    sendMessage();
    event.preventDefault(); // Prevent the default behavior of Enter key in text input
  }
});

socket.on('userTyping', (username) => {
  document.getElementById('typingIndicator').innerText = `${username} is typing...`;
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    document.getElementById('typingIndicator').innerText = '';
  }, 3000);
});
