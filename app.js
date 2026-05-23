// ══════════════════════════════════════
//  Firebase SDK — Modular via CDN
// ══════════════════════════════════════
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, onSnapshot, updateDoc, setDoc, getDoc,
  collection, addDoc, query, orderBy, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage, ref as sRef, uploadBytesResumable, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  onAuthStateChanged, signOut as fbSignOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCjXYmxmhAClkQuIao_KW6IBJW88AyCU3w",
  authDomain: "kosmi-1207b.firebaseapp.com",
  projectId: "kosmi-1207b",
  storageBucket: "kosmi-1207b.firebasestorage.app",
  messagingSenderId: "470660501695",
  appId: "1:470660501695:web:a41069d86fe3d4d65b760a"
};

const fbApp = initializeApp(firebaseConfig);
const db    = getFirestore(fbApp);
const stor  = getStorage(fbApp);
const auth  = getAuth(fbApp);

// ══════════════════════════════════════
//  State
// ══════════════════════════════════════
let currentUser     = null;   // Firebase user or guest object
let currentRoomId   = null;
let isUploading     = false;
let localObjectUrl  = null;
let isSyncing       = false;
let isLocalAction   = false;
let presenceTimer   = null;
let isDragging      = false;
let isMuted         = false;
let lastVolume      = 1;
let roomUnsub       = null;
let msgUnsub        = null;
let partUnsub       = null;
let roomState       = null;
let unreadCount     = 0;
let sidebarOpen     = false;
let currentSidebarTab = "chat";
let currentMode     = "create";

const SYNC_THRESHOLD = 2;

// ══════════════════════════════════════
//  Firebase Auth
// ══════════════════════════════════════
onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = {
      uid: user.uid,
      name: user.displayName || "مستخدم",
      photo: user.photoURL,
      isGoogle: true
    };
    loadHomeScreen();
  }
});

window.signInWithGoogle = async function() {
  const provider = new GoogleAuthProvider();
  const btn = document.getElementById("btn-google-signin");
  btn.disabled = true; btn.textContent = "جارٍ التسجيل...";
  try {
    await signInWithPopup(auth, provider);
    // onAuthStateChanged handles the rest
  } catch (e) {
    showError("auth-error", "فشل تسجيل الدخول. حاول مجدداً.");
    btn.disabled = false; btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> تسجيل الدخول بـ Google`;
  }
};

window.continueAsGuest = function() {
  const name = document.getElementById("input-guest-name").value.trim();
  if (!name) { showError("auth-error", "اختر اسماً للمتابعة"); return; }
  currentUser = { uid: "guest_" + Date.now(), name, photo: null, isGoogle: false };
  sessionStorage.setItem("wp_guest", JSON.stringify(currentUser));
  loadHomeScreen();
};

window.signOut = async function() {
  if (currentUser?.isGoogle) await fbSignOut(auth);
  currentUser = null;
  sessionStorage.removeItem("wp_guest");
  showScreen("auth");
};

function loadHomeScreen() {
  document.getElementById("user-display-name").textContent = currentUser.name;
  const initial = currentUser.name.charAt(0).toUpperCase();
  const av = document.getElementById("user-avatar");
  if (currentUser.photo) {
    av.innerHTML = `<img src="${currentUser.photo}" alt="${currentUser.name}" />`;
  } else {
    av.textContent = initial;
  }
  document.getElementById("input-username").value = currentUser.name;
  renderRecentRooms();
  showScreen("home");
}

// ══════════════════════════════════════
//  Home Screen
// ══════════════════════════════════════
window.switchTab = function(mode) {
  currentMode = mode;
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById("tab-" + mode).classList.add("active");
  document.getElementById("field-roomid").style.display = mode === "join" ? "" : "none";
  document.getElementById("btn-text").textContent =
    mode === "create" ? "إنشاء غرفة جديدة" : "الانضمام إلى الغرفة";
  document.getElementById("home-error").classList.remove("show");
};

window.handleSubmit = async function() {
  const username = document.getElementById("input-username").value.trim();
  const roomInput = document.getElementById("input-roomid").value.trim().toUpperCase();
  if (!username) { showError("home-error", "أدخل اسمك في الغرفة"); return; }
  if (currentMode === "join" && !roomInput) { showError("home-error", "أدخل رمز الغرفة"); return; }

  const btn = document.getElementById("btn-submit");
  btn.disabled = true;
  document.getElementById("btn-text").textContent = "جارٍ المعالجة...";

  // Sync display name
  currentUser.name = username;

  try {
    if (currentMode === "create") {
      const id = generateRoomId();
      await setDoc(doc(db, "rooms", id), {
        createdAt: serverTimestamp(),
        videoUrl: null, videoName: null,
        isPlaying: false, currentTime: 0,
        updatedAt: Date.now(),
        hostId: currentUser.uid,
        hostName: username,
        videoUploading: false
      });
      saveRoomHistory(id, username);
      await enterRoom(id);
    } else {
      const snap = await getDoc(doc(db, "rooms", roomInput));
      if (!snap.exists()) { showError("home-error", "الغرفة غير موجودة. تحقق من الرمز."); return; }
      saveRoomHistory(roomInput, username);
      await enterRoom(roomInput);
    }
  } catch (e) {
    console.error(e);
    showError("home-error", "حدث خطأ، تحقق من اتصالك.");
  } finally {
    btn.disabled = false;
    switchTab(currentMode);
  }
};

// ══════════════════════════════════════
//  Room History (localStorage)
// ══════════════════════════════════════
function getRoomHistory() {
  try { return JSON.parse(localStorage.getItem("wp_rooms") || "[]"); } catch { return []; }
}
function saveRoomHistory(roomId, username) {
  let history = getRoomHistory();
  history = history.filter(r => r.id !== roomId);
  history.unshift({ id: roomId, username, ts: Date.now() });
  history = history.slice(0, 8); // keep latest 8
  localStorage.setItem("wp_rooms", JSON.stringify(history));
  renderRecentRooms();
}
function renderRecentRooms() {
  const history = getRoomHistory();
  const section = document.getElementById("recent-section");
  const list = document.getElementById("recent-list");
  if (!history.length) { section.style.display = "none"; return; }
  section.style.display = "";
  list.innerHTML = "";
  history.forEach(r => {
    const ago = timeAgo(r.ts);
    const div = document.createElement("div");
    div.className = "recent-item";
    div.innerHTML = `
      <div class="recent-item-icon">🎬</div>
      <div class="recent-item-info">
        <div class="recent-item-id">${r.id}</div>
        <div class="recent-item-meta">كـ ${esc(r.username)} · ${ago}</div>
      </div>
      <span class="recent-item-join">دخول ←</span>
    `;
    div.onclick = () => quickJoin(r.id, r.username);
    list.appendChild(div);
  });
}
async function quickJoin(roomId, username) {
  const btn = document.getElementById("btn-submit");
  btn.disabled = true;
  document.getElementById("btn-text").textContent = "جارٍ الدخول...";
  try {
    const snap = await getDoc(doc(db, "rooms", roomId));
    if (!snap.exists()) { toast("الغرفة لم تعد موجودة", "error"); removeFromHistory(roomId); return; }
    currentUser.name = username;
    await enterRoom(roomId);
  } catch {
    toast("فشل الاتصال", "error");
  } finally {
    btn.disabled = false;
    document.getElementById("btn-text").textContent = currentMode === "create" ? "إنشاء غرفة جديدة" : "الانضمام إلى الغرفة";
  }
}
function removeFromHistory(id) {
  let h = getRoomHistory().filter(r => r.id !== id);
  localStorage.setItem("wp_rooms", JSON.stringify(h));
  renderRecentRooms();
}
window.clearHistory = function() {
  localStorage.removeItem("wp_rooms"); renderRecentRooms();
};

// ══════════════════════════════════════
//  Enter Room
// ══════════════════════════════════════
async function enterRoom(roomId) {
  currentRoomId = roomId;
  roomState = null; isUploading = false; isSyncing = false; isLocalAction = false;
  unreadCount = 0; sidebarOpen = false;
  if (localObjectUrl) { URL.revokeObjectURL(localObjectUrl); localObjectUrl = null; }

  const vid = getVideo();
  vid.src = ""; vid.load();

  setOverlay("overlay-empty");
  document.getElementById("room-id-display").textContent = roomId;
  document.getElementById("room-title-badge").textContent = "";
  document.getElementById("video-title-overlay").textContent = "";
  document.getElementById("messages-list").innerHTML = '<div class="no-messages">لا توجد رسائل بعد</div>';
  document.getElementById("participants-list").innerHTML = "";
  document.getElementById("participants-count").textContent = "0";
  updateUnreadBadge(0);
  resetControls();
  closeSidebar();
  showScreen("room");

  subscribeRoom();
  subscribeMessages();
  subscribeParticipants();
  startPresence();
}

// ══════════════════════════════════════
//  Firestore Subscriptions
// ══════════════════════════════════════
function subscribeRoom() {
  if (roomUnsub) roomUnsub();
  roomUnsub = onSnapshot(doc(db, "rooms", currentRoomId), snap => {
    if (!snap.exists()) { toast("الغرفة انتهت", "error"); leaveRoom(); return; }
    const prev = roomState;
    roomState = snap.data();
    syncVideoToState(prev);
  });
}

function subscribeMessages() {
  if (msgUnsub) msgUnsub();
  const q = query(collection(db, "rooms", currentRoomId, "messages"), orderBy("timestamp","asc"), limit(300));
  let firstLoad = true;
  msgUnsub = onSnapshot(q, snap => {
    const msgs = snap.docs.map(d => ({id:d.id,...d.data()}));
    renderMessages(msgs);
    if (!firstLoad && !sidebarOpen && currentSidebarTab === "chat") {
      const last = msgs[msgs.length-1];
      if (last && last.username !== currentUser.name && !last.system) {
        unreadCount++;
        updateUnreadBadge(unreadCount);
      }
    }
    firstLoad = false;
  });
}

function subscribeParticipants() {
  if (partUnsub) partUnsub();
  const q = query(collection(db, "rooms", currentRoomId, "participants"), orderBy("lastSeen","desc"));
  partUnsub = onSnapshot(q, snap => {
    const now = Date.now();
    const active = snap.docs.map(d=>d.data()).filter(p=>now-p.lastSeen<15000);
    const seen = new Set();
    const unique = active.filter(p=>{if(seen.has(p.uid))return false;seen.add(p.uid);return true;});
    renderParticipants(unique);
    document.getElementById("participants-count").textContent = unique.length;
  });
}

function startPresence() {
  if (presenceTimer) clearInterval(presenceTimer);
  const push = () => addDoc(collection(db, "rooms", currentRoomId, "participants"), {
    uid: currentUser.uid, username: currentUser.name,
    photo: currentUser.photo || null,
    joinedAt: Date.now(), lastSeen: Date.now()
  });
  push();
  presenceTimer = setInterval(push, 8000);
}

// ══════════════════════════════════════
//  Video Sync
// ══════════════════════════════════════
function syncVideoToState(prev) {
  const video = getVideo();
  if (!video || !roomState || isSyncing || isLocalAction) return;
  isSyncing = true;

  const effectiveUrl = localObjectUrl || roomState.videoUrl;

  // Update overlays
  if (!effectiveUrl && !roomState.videoUploading) {
    setOverlay("overlay-empty");
  } else if (roomState.videoUploading && !localObjectUrl) {
    const fname = roomState.videoName ? `"${roomState.videoName}"` : "الفيديو";
    document.getElementById("uploading-filename").textContent =
      `${esc(roomState.hostName || "المضيف")} يرفع ${fname}، سيبدأ التشغيل تلقائياً`;
    setOverlay("overlay-uploading");
  } else if (effectiveUrl) {
    if (video.src !== effectiveUrl) {
      setOverlay(null);
      video.src = effectiveUrl;
      video.load();
    } else if (video.readyState > 0) {
      setOverlay(null);
    }
  }

  // Update video name overlay
  if (roomState.videoName) {
    document.getElementById("video-title-overlay").textContent = "🎬 " + roomState.videoName;
    document.getElementById("room-title-badge").textContent = roomState.videoName;
  }

  // Sync playback
  if (!isUploading && effectiveUrl && video.readyState > 0) {
    const elapsed = (Date.now() - roomState.updatedAt) / 1000;
    const target = roomState.isPlaying
      ? roomState.currentTime + elapsed
      : roomState.currentTime;

    if (isFinite(target) && Math.abs(video.currentTime - target) > SYNC_THRESHOLD) {
      video.currentTime = Math.min(target, video.duration || target);
    }
    if (roomState.isPlaying && video.paused) video.play().catch(()=>{});
    else if (!roomState.isPlaying && !video.paused) video.pause();
  }

  // Sync indicator
  const syncEl = document.getElementById("sync-indicator");
  if (effectiveUrl && !isUploading) syncEl.style.display = "flex";
  else syncEl.style.display = "none";

  updatePlayBtn();
  isSyncing = false;
}

async function pushState(state) {
  if (!currentRoomId) return;
  isLocalAction = true;
  try { await updateDoc(doc(db, "rooms", currentRoomId), {...state, updatedAt: Date.now()}); }
  finally { setTimeout(()=>{ isLocalAction=false; }, 600); }
}

// ══════════════════════════════════════
//  Video Controls
// ══════════════════════════════════════
function getVideo() { return document.getElementById("video-player"); }

window.togglePlay = function() {
  const v = getVideo(); if (!v?.src) return;
  if (v.paused) { v.play().catch(()=>{}); pushState({isPlaying:true, currentTime:v.currentTime}); }
  else          { v.pause();              pushState({isPlaying:false,currentTime:v.currentTime}); }
  updatePlayBtn();
};

window.skipVideo = function(s) {
  const v = getVideo(); if (!v?.src) return;
  const t = Math.max(0, Math.min(v.currentTime+s, v.duration||0));
  v.currentTime = t;
  pushState({currentTime:t, isPlaying:!v.paused});
};

window.toggleMute = function() {
  const v = getVideo(); if (!v) return;
  if (isMuted) { v.volume=lastVolume||0.7; isMuted=false; document.getElementById("btn-mute").textContent="🔊"; document.getElementById("volume-slider").value=v.volume; }
  else { lastVolume=v.volume; v.volume=0; isMuted=true; document.getElementById("btn-mute").textContent="🔇"; document.getElementById("volume-slider").value=0; }
  document.getElementById("vol-pct").textContent=Math.round((isMuted?0:v.volume)*100)+"%";
};

window.setVolume = function(val) {
  const v = getVideo(); if (!v) return;
  v.volume=+val; isMuted=(+val===0);
  document.getElementById("btn-mute").textContent=isMuted?"🔇":"🔊";
  document.getElementById("vol-pct").textContent=Math.round(+val*100)+"%";
};

window.toggleFullscreen = function() {
  const v = getVideo(); if (!v) return;
  if (document.fullscreenElement) document.exitFullscreen();
  else v.requestFullscreen().catch(()=>{ document.getElementById("video-wrapper").requestFullscreen?.(); });
};

function updatePlayBtn() {
  const v = getVideo();
  document.getElementById("btn-play").textContent = (v&&!v.paused)?"⏸":"▶";
}
function resetControls() {
  document.getElementById("time-current").textContent="0:00";
  document.getElementById("time-total").textContent="0:00";
  document.getElementById("progress-fill").style.width="0%";
  document.getElementById("progress-thumb").style.left="0%";
  document.getElementById("btn-play").textContent="▶";
  document.getElementById("volume-slider").value=1;
  document.getElementById("vol-pct").textContent="100%";
}

// ── Video Events ──
const video = getVideo();

video.addEventListener("timeupdate", () => {
  const d=video.duration||0, c=video.currentTime;
  const pct=d>0?(c/d)*100:0;
  document.getElementById("time-current").textContent=formatTime(c);
  document.getElementById("progress-fill").style.width=pct+"%";
  document.getElementById("progress-thumb").style.left=pct+"%";
});
video.addEventListener("loadedmetadata", () => {
  document.getElementById("time-total").textContent=formatTime(video.duration);
});
video.addEventListener("play",  updatePlayBtn);
video.addEventListener("pause", updatePlayBtn);
video.addEventListener("waiting", () => {
  if(video.src&&(localObjectUrl||roomState?.videoUrl)) setOverlay("overlay-buffering");
});
video.addEventListener("canplay", () => {
  if(localObjectUrl||roomState?.videoUrl) setOverlay(null);
});
video.addEventListener("ended", () => {
  pushState({isPlaying:false,currentTime:0}); video.currentTime=0;
});

// ── Progress Bar ──
const track=document.getElementById("progress-track");
function seekTo(e, commit=false) {
  const r=track.getBoundingClientRect();
  const ratio=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
  const t=ratio*(video.duration||0);
  video.currentTime=t;
  document.getElementById("progress-fill").style.width=(ratio*100)+"%";
  document.getElementById("progress-thumb").style.left=(ratio*100)+"%";
  document.getElementById("time-current").textContent=formatTime(t);
  if(commit) pushState({currentTime:t,isPlaying:!video.paused});
}
track.addEventListener("mousedown",e=>{isDragging=true;seekTo(e);});
document.addEventListener("mousemove",e=>{if(isDragging)seekTo(e);});
document.addEventListener("mouseup",e=>{if(isDragging){isDragging=false;seekTo(e,true);}});
track.addEventListener("touchstart",e=>{isDragging=true;seekTouch(e);},{passive:true});
document.addEventListener("touchmove",e=>{if(isDragging)seekTouch(e);},{passive:true});
document.addEventListener("touchend",e=>{if(isDragging){isDragging=false;seekTouch(e,true);}});
function seekTouch(e,commit=false){
  const t=commit?e.changedTouches[0]:e.touches[0];
  if(t) seekTo(t,commit);
}

// ══════════════════════════════════════
//  Keyboard Shortcuts
// ══════════════════════════════════════
document.addEventListener("keydown", e => {
  if(!currentRoomId) return;
  const tag=document.activeElement?.tagName?.toLowerCase();
  if(tag==="input"||tag==="textarea") return;
  switch(e.code) {
    case "Space": e.preventDefault(); window.togglePlay(); break;
    case "ArrowLeft": e.preventDefault(); window.skipVideo(-10); break;
    case "ArrowRight": e.preventDefault(); window.skipVideo(10); break;
    case "KeyM": window.toggleMute(); break;
    case "KeyF": window.toggleFullscreen(); break;
    case "ArrowUp": e.preventDefault(); { const sl=document.getElementById("volume-slider"); sl.value=Math.min(1,+sl.value+0.1); window.setVolume(sl.value); } break;
    case "ArrowDown": e.preventDefault(); { const sl=document.getElementById("volume-slider"); sl.value=Math.max(0,+sl.value-0.1); window.setVolume(sl.value); } break;
  }
});

// ══════════════════════════════════════
//  File Upload
// ══════════════════════════════════════
window.handleFileUpload = async function(e) {
  const file=e.target.files?.[0]; if(!file||!currentRoomId) return;
  if(localObjectUrl) URL.revokeObjectURL(localObjectUrl);
  localObjectUrl=URL.createObjectURL(file);
  isUploading=true;

  video.src=localObjectUrl; video.load(); video.play().catch(()=>{});
  setOverlay(null);

  await updateDoc(doc(db,"rooms",currentRoomId), {
    videoUploading:true, videoName:file.name,
    videoUrl:null, isPlaying:false, currentTime:0, updatedAt:Date.now()
  });

  const ref=sRef(stor,`rooms/${currentRoomId}/${Date.now()}_${file.name}`);
  const task=uploadBytesResumable(ref,file);
  toast("⬆ الرفع يتم في الخلفية...", "success");

  task.on("state_changed", ()=>{},
    err=>{ console.error(err); isUploading=false; toast("فشل رفع الفيديو","error"); updateDoc(doc(db,"rooms",currentRoomId),{videoUploading:false}); },
    async()=>{
      const url=await getDownloadURL(task.snapshot.ref);
      const t=video.currentTime; const playing=!video.paused;
      isLocalAction=true;
      await updateDoc(doc(db,"rooms",currentRoomId),{
        videoUrl:url, videoName:file.name,
        videoUploading:false, isPlaying:playing,
        currentTime:t, updatedAt:Date.now()
      });
      setTimeout(()=>{isLocalAction=false;},600);
      isUploading=false;
      if(localObjectUrl){URL.revokeObjectURL(localObjectUrl);localObjectUrl=null;}
      await sendSystemMsg(`${currentUser.name} رفع فيديو: ${file.name}`);
      toast("✅ تم الرفع، يشاهد الجميع الآن!", "success");
    }
  );
  e.target.value="";
};

// ══════════════════════════════════════
//  Chat
// ══════════════════════════════════════
document.getElementById("chat-input").addEventListener("keydown", e=>{
  if(e.key==="Enter") window.sendMessage();
});
window.sendMessage = async function() {
  const inp=document.getElementById("chat-input");
  const text=inp.value.trim(); if(!text||!currentRoomId) return;
  inp.value="";
  await addDoc(collection(db,"rooms",currentRoomId,"messages"),{
    uid: currentUser.uid,
    username:currentUser.name,
    photo:currentUser.photo||null,
    text, timestamp:Date.now()
  });
};

async function sendSystemMsg(text) {
  if(!currentRoomId) return;
  await addDoc(collection(db,"rooms",currentRoomId,"messages"),{
    username:"النظام", text, timestamp:Date.now(), system:true
  });
}

function renderMessages(msgs) {
  const list=document.getElementById("messages-list");
  const wasAtBottom=list.scrollHeight-list.clientHeight<=list.scrollTop+40;
  list.innerHTML="";
  if(!msgs.length){list.innerHTML='<div class="no-messages">لا توجد رسائل بعد</div>';return;}
  msgs.forEach(msg=>{
    const div=document.createElement("div");
    div.className="msg"+(msg.system?" system":"");
    if(msg.system){
      div.innerHTML=`<span class="msg-text">${esc(msg.text)}</span>`;
    } else {
      const isMe=msg.username===currentUser.name;
      div.innerHTML=`
        <div class="msg-meta">
          <span class="msg-name${isMe?" me":""}">${esc(msg.username)}</span>
          <span class="msg-time">${formatTimestamp(msg.timestamp)}</span>
        </div>
        <div class="msg-text">${esc(msg.text)}</div>
      `;
    }
    list.appendChild(div);
  });
  if(wasAtBottom) list.scrollTop=list.scrollHeight;
}

// ══════════════════════════════════════
//  Participants
// ══════════════════════════════════════
function renderParticipants(list) {
  const ul=document.getElementById("participants-list"); ul.innerHTML="";
  list.forEach(p=>{
    const isHost=p.uid===roomState?.hostId;
    const initial=p.username?.charAt(0).toUpperCase()||"؟";
    const li=document.createElement("li");
    li.className="participant-item";
    const avatarHtml=p.photo
      ?`<img src="${p.photo}" alt="${esc(p.username)}" />`
      :initial;
    li.innerHTML=`
      <div class="participant-avatar">${avatarHtml}</div>
      <div class="participant-info">
        <div class="participant-name">${esc(p.username)}${isHost?'<span class="host-badge" style="margin-right:6px">مضيف</span>':""}</div>
      </div>
      <div class="participant-dot"></div>
    `;
    ul.appendChild(li);
  });
}

// ══════════════════════════════════════
//  Sidebar (mobile drawer)
// ══════════════════════════════════════
window.toggleSidebar = function(tab) {
  if(window.innerWidth>640){
    switchSidebarTab(tab); return;
  }
  if(sidebarOpen && currentSidebarTab===tab){ closeSidebar(); return; }
  switchSidebarTab(tab);
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebar-backdrop").classList.add("show");
  sidebarOpen=true;
  if(tab==="chat"){ unreadCount=0; updateUnreadBadge(0); }
};

window.closeSidebar = function() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-backdrop").classList.remove("show");
  sidebarOpen=false;
};

window.switchSidebarTab = function(tab) {
  currentSidebarTab=tab;
  document.querySelectorAll(".stab").forEach(b=>b.classList.remove("active"));
  document.querySelectorAll(".stab-content").forEach(c=>c.classList.remove("active"));
  document.getElementById("stab-"+tab).classList.add("active");
  document.getElementById("scontent-"+tab).classList.add("active");
  if(tab==="chat"){ unreadCount=0; updateUnreadBadge(0); }
};

function updateUnreadBadge(n) {
  const badge=document.getElementById("unread-badge");
  badge.textContent=n; badge.style.display=n>0?"":"none";
}

// ══════════════════════════════════════
//  Room utilities
// ══════════════════════════════════════
window.copyRoomId = function() {
  if(!currentRoomId) return;
  navigator.clipboard.writeText(currentRoomId).catch(()=>{});
  document.getElementById("copy-icon").textContent="✅";
  toast("📋 تم نسخ رمز الغرفة!", "success");
  setTimeout(()=>{ document.getElementById("copy-icon").textContent="📋"; },2000);
};

window.leaveRoom = function() {
  if(roomUnsub){ roomUnsub(); roomUnsub=null; }
  if(msgUnsub){  msgUnsub();  msgUnsub=null; }
  if(partUnsub){ partUnsub(); partUnsub=null; }
  if(presenceTimer){ clearInterval(presenceTimer); presenceTimer=null; }
  if(localObjectUrl){ URL.revokeObjectURL(localObjectUrl); localObjectUrl=null; }
  video.pause(); video.src=""; video.load();
  currentRoomId=null; roomState=null; isUploading=false;
  closeSidebar();
  showScreen("home");
  switchTab("create");
  renderRecentRooms();
};

// ══════════════════════════════════════
//  Toast Notifications
// ══════════════════════════════════════
window.toast = function(msg, type="info") {
  const container=document.getElementById("toast-container");
  const el=document.createElement("div");
  el.className="toast "+(type||"");
  el.textContent=msg;
  container.appendChild(el);
  setTimeout(()=>el.remove(),3000);
};

// ══════════════════════════════════════
//  Utilities
// ══════════════════════════════════════
function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.getElementById("screen-"+name).classList.add("active");
}
function setOverlay(id) {
  document.querySelectorAll(".overlay").forEach(o=>o.classList.add("hidden"));
  if(id) document.getElementById(id)?.classList.remove("hidden");
}
function showError(id, msg) {
  const el=document.getElementById(id);
  el.textContent=msg; el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"),4000);
}
function generateRoomId() {
  const c="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({length:8},()=>c[Math.floor(Math.random()*c.length)]).join("");
}
function formatTime(s) {
  if(!isFinite(s)||s<0) s=0;
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=Math.floor(s%60);
  if(h>0) return `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  return `${m}:${String(sec).padStart(2,"0")}`;
}
function formatTimestamp(ts) {
  return new Date(ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
}
function timeAgo(ts) {
  const s=Math.floor((Date.now()-ts)/1000);
  if(s<60) return "الآن";
  const m=Math.floor(s/60); if(m<60) return `منذ ${m} دقيقة`;
  const h=Math.floor(m/60); if(h<24) return `منذ ${h} ساعة`;
  return `منذ ${Math.floor(h/24)} يوم`;
}
function esc(str) {
  return String(str||"")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ══════════════════════════════════════
//  Init
// ══════════════════════════════════════
// Try restore guest session
const guest=sessionStorage.getItem("wp_guest");
if(guest) {
  try {
    currentUser=JSON.parse(guest);
    loadHomeScreen();
  } catch { showScreen("auth"); }
} else {
  showScreen("auth");
}

// Home input keys
document.getElementById("input-username")?.addEventListener("keydown",e=>{ if(e.key==="Enter") window.handleSubmit(); });
document.getElementById("input-roomid")?.addEventListener("keydown",e=>{ if(e.key==="Enter") window.handleSubmit(); });
document.getElementById("input-roomid")?.addEventListener("input",e=>{ e.target.value=e.target.value.toUpperCase(); });
document.getElementById("input-guest-name")?.addEventListener("keydown",e=>{ if(e.key==="Enter") window.continueAsGuest(); });
