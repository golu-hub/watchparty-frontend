const params = new URLSearchParams(window.location.search);
const room = params.get("room");
const password = params.get("password");

document.getElementById("roomTitle").innerText = `Room: ${room}`;

const socket = new WebSocket("wss://watchparty-server-xnp3.onrender.com");

let player;
let isRemoteAction = false;

socket.onopen = () => {
  socket.send(JSON.stringify({
    type: "join",
    room,
    password
  }));
};

socket.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === "state") {
    loadVideo(msg.videoId, msg.time, msg.playing);
    updateUsers(msg.users);
  }

  if (msg.type === "play") {
    isRemoteAction = true;
    player.playVideo();
  }

  if (msg.type === "pause") {
    isRemoteAction = true;
    player.pauseVideo();
  }

  if (msg.type === "seek") {
    isRemoteAction = true;
    player.seekTo(msg.time, true);
  }

  if (msg.type === "video") {
    loadVideo(msg.videoId, msg.time, msg.playing);
  }
};

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "360",
    width: "640",
    videoId: "",
    events: {
      onStateChange
    }
  });
}

function loadVideo(videoId, time, playing) {
  player.loadVideoById(videoId, time);
  if (!playing) player.pauseVideo();
}

function onStateChange(e) {
  if (isRemoteAction) {
    isRemoteAction = false;
    return;
  }

  if (e.data === YT.PlayerState.PLAYING) {
    socket.send(JSON.stringify({ type: "play", room }));
  }

  if (e.data === YT.PlayerState.PAUSED) {
    socket.send(JSON.stringify({ type: "pause", room }));
  }
}

function play() {
  socket.send(JSON.stringify({ type: "play", room }));
}

function pause() {
  socket.send(JSON.stringify({ type: "pause", room }));
}

function changeVideo() {
  const videoId = document.getElementById("videoId").value.trim();
  socket.send(JSON.stringify({ type: "video", room, videoId }));
}

function updateUsers(users) {
  const ul = document.getElementById("users");
  ul.innerHTML = "";
  users.forEach(u => {
    const li = document.createElement("li");
    li.textContent = u;
    ul.appendChild(li);
  });
}
