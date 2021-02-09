const socket = io('/');
const roomPeer = new Peer(undefined, {
  host: '/',
  port: '3001',
});
const $videoGrid = document.querySelector('.video-grid');
const peers = {};

const createVideo = () => {
  const video = document.createElement('video');
  video.muted = true;

  return video;
};

navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then(stream => {
    const userVideo = createVideo();

    addVideoStream(userVideo, stream);

    roomPeer.on('call', call => {
      const newUserVideo = createVideo();

      call.answer(stream);

      call.on('stream', newUserVideoStream => {
        addVideoStream(newUserVideo, newUserVideoStream);
      });
    });

    socket.on('user-connected', userId => {
      connectToNewUser(userId, stream);
    });
  });

socket.on('user-disconnected', userId => {
  peers[userId]?.close();
});

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });

  $videoGrid.append(video);
};

const connectToNewUser = (userId, stream) => {
  const call = roomPeer.call(userId, stream);
  const newUserVideo = createVideo();

  call.on('stream', userVideoStream => {
    addVideoStream(newUserVideo, userVideoStream);
  });

  call.on('close', () => {
    newUserVideo.remove();
  });

  peers[userId] = call;
};

roomPeer.on('open', roomId => {
  socket.emit('join-room', ROOM_ID, roomId);
});
