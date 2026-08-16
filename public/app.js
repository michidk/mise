const $ = (selector) => document.querySelector(selector);

const landing = $('#landing');
const hostRoom = $('#host-room');
const viewerRoom = $('#viewer-room');
const hostVideo = $('#local-video');
const viewerVideo = $('#remote-video');
const toast = $('#toast');
const qualityMenu = $('#quality-menu');
const appBaseUrl = new URL(document.baseURI);
const appBasePath = appBaseUrl.pathname.replace(/\/$/, '');

function appPath(pathname = '') {
  const suffix = pathname.replace(/^\/+/, '');
  return `${appBasePath}/${suffix}` || '/';
}

// Keep one settings panel for both creators and viewers.
document.body.append(qualityMenu);

let peer;
let localStream;
let roomId;
let viewerControl;
let incomingCall;
let pendingIncomingCall;
let pendingIncomingTimer;
let viewerEnded = false;
let isRoomCreator = false;
let activePresenterId;
let activePresenterName = '';
let viewerName = '';
let shareRequestPending = false;
let maxViewers = 5;
let guestNumber = 0;
let rtcConfig = { iceServers: [{ urls: 'stun:main.lohr.dev:3478' }] };
let currentQuality = 'balanced';
let presentationAudienceSize = 0;

const hostConnections = new Map();
const outgoingCalls = new Map();
const chatHistory = [];

const qualityPresets = {
  data: { width: 1280, height: 720, frameRate: 15, bitrate: 1_200_000, label: '720p', buttonLabel: 'Data saver', contentHint: 'detail' },
  balanced: { width: 1920, height: 1080, frameRate: 30, bitrate: 3_500_000, label: '1080p', buttonLabel: 'Balanced', contentHint: '' },
  sharp: { width: 2560, height: 1440, frameRate: 30, bitrate: 6_000_000, label: '1440p', buttonLabel: 'Text clarity', contentHint: 'detail' },
  smooth: { width: 1920, height: 1080, frameRate: 60, bitrate: 7_000_000, label: '1080p · 60', buttonLabel: 'Smooth motion', contentHint: 'motion' },
};
let currentStreamSettings = { ...qualityPresets.balanced };

const configReady = fetch(appPath('config'))
  .then((response) => response.json())
  .then((config) => {
    rtcConfig = { iceServers: config.iceServers };
    maxViewers = config.maxViewers;
    updateBandwidthEstimate();
  })
  .catch(() => {});

function setScreen(screen) {
  landing.hidden = screen !== 'landing';
  hostRoom.hidden = screen !== 'host';
  viewerRoom.hidden = screen !== 'viewer';
  document.body.dataset.screen = screen;
}

function showToast(message, tone = 'default') {
  toast.textContent = message;
  toast.dataset.tone = tone;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 3200);
}

function makeRoomId() {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const code = Array.from(bytes, (byte) => alphabet[byte & 31]).join('');
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

function normalizeRoomCode(value) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '');
  const match = normalized.match(/(?:room\/)?([a-z0-9-]{6,32})\/?$/);
  return match?.[1] || '';
}

function renderRoomCode(code) {
  const container = $('#host-room-code');
  const groups = code.split('-');
  container.replaceChildren();
  container.setAttribute('aria-label', `Room code ${groups.join(' ')}`);

  groups.forEach((group, groupIndex) => {
    if (groupIndex) {
      const separator = document.createElement('span');
      separator.className = 'room-code-separator';
      separator.textContent = '–';
      separator.setAttribute('aria-hidden', 'true');
      container.append(separator);
    }
    for (const character of group) {
      const digit = document.createElement('span');
      digit.className = 'room-code-digit';
      digit.textContent = character;
      digit.setAttribute('aria-hidden', 'true');
      container.append(digit);
    }
  });
}

function peerOptions() {
  const secure = location.protocol === 'https:';
  return {
    host: location.hostname,
    port: location.port ? Number(location.port) : secure ? 443 : 80,
    path: appPath('peerjs'),
    secure,
    config: rtcConfig,
    debug: 1,
  };
}

function waitForPeerOpen(instance) {
  return new Promise((resolve, reject) => {
    const onOpen = (id) => {
      instance.off('error', onError);
      resolve(id);
    };
    const onError = (error) => {
      instance.off('open', onOpen);
      reject(error);
    };
    instance.once('open', onOpen);
    instance.once('error', onError);
  });
}

async function captureDisplay() {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error('Screen sharing is not supported in this browser.');
  }
  const settings = currentStreamSettings;
  const video = { frameRate: { ideal: settings.frameRate, max: settings.frameRate } };
  if (settings.width && settings.height) {
    video.width = { max: settings.width };
    video.height = { max: settings.height };
  }
  const stream = await navigator.mediaDevices.getDisplayMedia({ video, audio: true });
  const track = stream.getVideoTracks()[0];
  track.contentHint = settings.contentHint;
  track.onended = () => stopLocalPresentation();
  return stream;
}

async function startSharing() {
  const button = $('#share-button');
  button.disabled = true;
  button.classList.add('loading');
  try {
    localStream = await captureDisplay();
    await configReady;

    isRoomCreator = true;
    roomId = makeRoomId();
    renderRoomCode(roomId);
    $('#share-link').value = `${location.origin}${appPath(`room/${roomId}`)}`;
    history.replaceState({}, '', appPath(`room/${roomId}`));
    setScreen('host');

    peer = new Peer(roomId, peerOptions());
    peer.on('connection', acceptViewer);
    peer.on('call', receiveScreen);
    peer.on('error', handleHostPeerError);
    peer.on('disconnected', reconnectPeer);
    await waitForPeerOpen(peer);

    setPresenterState(peer.id, 'Host');
    showStageStream(localStream, true);
    updateBandwidthEstimate();
  } catch (error) {
    discardLocalStream();
    peer?.destroy();
    peer = undefined;
    isRoomCreator = false;
    setScreen('landing');
    history.replaceState({}, '', appPath());
    if (error.name !== 'NotAllowedError') {
      const message = error.type === 'unavailable-id'
        ? 'That room code was taken. Please try again.'
        : error.message || 'Could not start sharing.';
      showToast(message, 'error');
    }
  } finally {
    button.disabled = false;
    button.classList.remove('loading');
  }
}

async function joinRoom(id) {
  roomId = id;
  isRoomCreator = false;
  viewerEnded = false;
  $('#viewer-room-code').textContent = roomId;
  setScreen('viewer');
  setViewerState('waiting', 'Joining the room…', 'Connecting to the room creator.');
  await configReady;

  peer = new Peer(undefined, peerOptions());
  peer.on('call', receiveScreen);
  peer.on('error', handleViewerPeerError);
  peer.on('disconnected', reconnectPeer);

  try {
    await waitForPeerOpen(peer);
    viewerControl = peer.connect(roomId, {
      metadata: { role: 'viewer', version: 2 },
      serialization: 'json',
      reliable: true,
    });
    viewerControl.on('open', () => setViewerConnectionStatus('waiting', 'Connected'));
    viewerControl.on('data', handleRoomMessage);
    viewerControl.on('close', () => {
      if (!peer?.destroyed) endViewer('The room is no longer available.');
    });
    viewerControl.on('error', () => endViewer('Could not reach the room creator.'));
  } catch (error) {
    handleViewerPeerError(error);
  }
}

function acceptViewer(connection) {
  if (connection.metadata?.role !== 'viewer') return connection.close();
  if (hostConnections.size >= maxViewers) {
    connection.on('open', () => {
      connection.send({ type: 'room-full' });
      setTimeout(() => connection.close(), 100);
    });
    return;
  }

  const viewerId = connection.peer;
  guestNumber += 1;
  hostConnections.set(viewerId, {
    control: connection,
    name: `Guest ${guestNumber}`,
    lastMessageAt: 0,
  });
  updateViewerCount(hostConnections.size);

  connection.on('open', () => {
    const viewer = hostConnections.get(viewerId);
    if (!viewer) return;
    connection.send({ type: 'accepted', name: viewer.name });
    connection.send({ type: 'chat-history', messages: chatHistory });
    connection.send(presenterMessage());

    if (activePresenterId === peer.id && localStream?.active) {
      callParticipant(viewerId);
    } else if (activePresenterId && activePresenterId !== peer.id) {
      hostConnections.get(activePresenterId)?.control.send({ type: 'participant-joined', peerId: viewerId });
    }
  });
  connection.on('data', (message) => handleViewerData(viewerId, message));
  connection.on('close', () => removeViewer(viewerId));
  connection.on('error', () => removeViewer(viewerId));
}

function handleRoomMessage(message) {
  switch (message?.type) {
    case 'room-full':
      endViewer('This room has reached its participant limit.');
      break;
    case 'room-closed':
      endViewer('The room was closed by its creator.');
      break;
    case 'accepted':
      viewerName = message.name || 'Guest';
      setChatEnabled(true);
      break;
    case 'chat-history':
      loadChatHistory(message.messages);
      break;
    case 'chat':
      appendChatMessage(message);
      break;
    case 'presenter-changed':
      setPresenterState(message.presenterId, message.presenterName);
      break;
    case 'share-approved':
      shareRequestPending = false;
      startCallsToParticipants(message.participants || []);
      break;
    case 'share-denied':
      shareRequestPending = false;
      discardLocalStream();
      updateRoomUI();
      showToast('Someone else started sharing first.', 'error');
      break;
    case 'participant-joined':
      if (isLocalPresenter()) callParticipant(message.peerId);
      break;
    case 'participant-left':
      closeOutgoingCall(message.peerId);
      break;
  }
}

function handleViewerData(viewerId, message) {
  if (message?.type === 'request-share') {
    approveViewerPresentation(viewerId);
    return;
  }
  if (message?.type === 'stop-presenting') {
    if (activePresenterId === viewerId) clearPresenter();
    return;
  }
  if (message?.type !== 'chat' || typeof message.text !== 'string') return;

  const viewer = hostConnections.get(viewerId);
  const text = message.text.trim().slice(0, 500);
  const now = Date.now();
  if (!viewer || !text || now - viewer.lastMessageAt < 300) return;
  viewer.lastMessageAt = now;

  const chatMessage = makeChatMessage({
    sender: 'viewer',
    senderId: viewerId,
    author: viewer.name,
    text,
  });
  rememberChatMessage(chatMessage);
  appendChatMessage(chatMessage);
  broadcast(chatMessage);
}

function approveViewerPresentation(viewerId) {
  const viewer = hostConnections.get(viewerId);
  if (!viewer || activePresenterId) {
    viewer?.control.send({ type: 'share-denied' });
    return;
  }

  setPresenterState(viewerId, viewer.name);
  broadcast(presenterMessage());
  const participants = [peer.id, ...hostConnections.keys()].filter((id) => id !== viewerId);
  viewer.control.send({ type: 'share-approved', participants });
}

function presenterMessage() {
  return {
    type: 'presenter-changed',
    presenterId: activePresenterId || null,
    presenterName: activePresenterName || '',
  };
}

function clearPresenter() {
  closeIncomingCall();
  setPresenterState(null, '');
  broadcast(presenterMessage());
}

async function startRoomPresentation() {
  if (activePresenterId || shareRequestPending || localStream) return;
  shareRequestPending = true;
  updateRoomUI();
  try {
    localStream = await captureDisplay();
    if (isRoomCreator) {
      if (activePresenterId) {
        discardLocalStream();
        shareRequestPending = false;
        updateRoomUI();
        showToast('Someone else started sharing first.', 'error');
        return;
      }
      shareRequestPending = false;
      setPresenterState(peer.id, 'Host');
      broadcast(presenterMessage());
      showStageStream(localStream, true);
      startCallsToParticipants([...hostConnections.keys()]);
    } else if (viewerControl?.open) {
      viewerControl.send({ type: 'request-share' });
    } else {
      throw new Error('The room connection is not ready.');
    }
  } catch (error) {
    shareRequestPending = false;
    discardLocalStream();
    updateRoomUI();
    if (error.name !== 'NotAllowedError') showToast(error.message || 'Could not share this screen.', 'error');
  }
}

function stopLocalPresentation() {
  if (!localStream) return;
  const wasPresenter = isLocalPresenter();
  closeAllOutgoingCalls();
  discardLocalStream();
  presentationAudienceSize = 0;

  if (wasPresenter && isRoomCreator) {
    clearPresenter();
  } else if (wasPresenter) {
    viewerControl?.send({ type: 'stop-presenting' });
    setPresenterState(null, '');
  } else {
    updateRoomUI();
  }
  updateBandwidthEstimate();
}

function discardLocalStream() {
  if (!localStream) return;
  for (const track of localStream.getTracks()) {
    track.onended = null;
    track.stop();
  }
  localStream = undefined;
}

function isLocalPresenter() {
  return Boolean(peer?.id && activePresenterId === peer.id);
}

function setPresenterState(presenterId, presenterName = '') {
  if (incomingCall && incomingCall.peer !== presenterId) closeIncomingCall();
  activePresenterId = presenterId || undefined;
  activePresenterName = presenterName || '';

  if (pendingIncomingCall && pendingIncomingCall.peer === activePresenterId) {
    const call = pendingIncomingCall;
    clearTimeout(pendingIncomingTimer);
    pendingIncomingCall = undefined;
    acceptIncomingScreen(call);
  } else if (pendingIncomingCall) {
    clearTimeout(pendingIncomingTimer);
    pendingIncomingCall.close();
    pendingIncomingCall = undefined;
  }

  if (isLocalPresenter() && localStream) {
    showStageStream(localStream, true);
  } else {
    clearStage();
  }
  updateRoomUI();
}

function updateRoomUI() {
  if (isRoomCreator) {
    const title = $('#room-title');
    if (isLocalPresenter()) title.textContent = 'You’re sharing your screen';
    else if (activePresenterId) title.textContent = `${activePresenterName || 'A guest'} is sharing`;
    else title.textContent = 'The room is open';

    $('#stop-button').hidden = !isLocalPresenter();
    $('#host-share-button').hidden = Boolean(activePresenterId || shareRequestPending);
    $('#host-placeholder-text').textContent = activePresenterId
      ? `Connecting to ${activePresenterName || 'the presenter'}…`
      : shareRequestPending ? 'Opening the screen picker…' : 'No one is sharing right now.';
    return;
  }

  const shareButton = $('#viewer-share-button');
  if (isLocalPresenter()) {
    shareButton.disabled = false;
    shareButton.textContent = 'Stop sharing';
    setViewerConnectionStatus('live', 'You are sharing');
  } else if (!activePresenterId && !shareRequestPending && !viewerEnded) {
    shareButton.disabled = false;
    shareButton.textContent = 'Share screen';
    setViewerConnectionStatus('waiting', 'Room open');
  } else {
    shareButton.disabled = true;
    shareButton.textContent = shareRequestPending ? 'Starting…' : 'Someone is sharing';
    if (activePresenterId) setViewerConnectionStatus('live', `${activePresenterName || 'A participant'} is sharing`);
  }

  if (!activePresenterId) {
    setViewerState('waiting', 'No one is sharing', 'You can share your screen, or wait for another participant.');
  } else if (!isLocalPresenter() && !viewerVideo.srcObject) {
    setViewerState('waiting', `${activePresenterName || 'A participant'} is sharing`, 'Connecting to their screen…');
  }
}

function showStageStream(stream, isLocal) {
  const video = isRoomCreator ? hostVideo : viewerVideo;
  const shell = video.closest('.video-shell');
  video.srcObject = stream;
  video.muted = isLocal;
  shell.classList.add('has-video');
  if (!isRoomCreator) $('#viewer-placeholder').hidden = true;
  video.play().catch(() => {
    if (!isRoomCreator) $('#play-button').hidden = false;
  });
}

function clearStage() {
  const video = isRoomCreator ? hostVideo : viewerVideo;
  video.srcObject = null;
  video.closest('.video-shell').classList.remove('has-video');
  if (!isRoomCreator) {
    $('#viewer-placeholder').hidden = false;
    $('#play-button').hidden = true;
  }
}

function receiveScreen(call) {
  if (call.metadata?.role !== 'presenter') {
    call.close();
    return;
  }
  if (!activePresenterId) {
    pendingIncomingCall?.close();
    pendingIncomingCall = call;
    clearTimeout(pendingIncomingTimer);
    pendingIncomingTimer = setTimeout(() => {
      if (pendingIncomingCall === call) pendingIncomingCall = undefined;
      call.close();
    }, 2500);
    return;
  }
  if (call.peer !== activePresenterId) {
    call.close();
    return;
  }
  acceptIncomingScreen(call);
}

function acceptIncomingScreen(call) {
  closeIncomingCall();
  incomingCall = call;
  call.answer();
  call.on('stream', (stream) => {
    if (incomingCall !== call || call.peer !== activePresenterId) return;
    showStageStream(stream, false);
    if (!isRoomCreator) setViewerConnectionStatus('live', `${activePresenterName || 'A participant'} is sharing`);
  });
  call.on('close', () => handleIncomingCallClosed(call));
  call.on('error', () => handleIncomingCallClosed(call));
}

function handleIncomingCallClosed(call) {
  if (incomingCall !== call) return;
  incomingCall = undefined;
  clearStage();
  updateRoomUI();
}

function closeIncomingCall() {
  clearTimeout(pendingIncomingTimer);
  pendingIncomingCall?.close();
  pendingIncomingCall = undefined;
  if (!incomingCall) return;
  const call = incomingCall;
  incomingCall = undefined;
  call.close();
}

function startCallsToParticipants(participantIds) {
  presentationAudienceSize = 0;
  for (const participantId of participantIds) callParticipant(participantId);
  updateBandwidthEstimate();
}

function callParticipant(participantId) {
  if (!participantId || participantId === peer?.id || !localStream?.active || outgoingCalls.has(participantId)) return;
  const call = peer.call(participantId, localStream, {
    metadata: { role: 'presenter', presenterName: isRoomCreator ? 'Host' : viewerName },
  });
  outgoingCalls.set(participantId, call);
  presentationAudienceSize += 1;
  updateBandwidthEstimate();
  setTimeout(() => applySenderQuality(call), 0);
  call.on('close', () => {
    if (outgoingCalls.get(participantId) !== call) return;
    outgoingCalls.delete(participantId);
    presentationAudienceSize = Math.max(0, presentationAudienceSize - 1);
    updateBandwidthEstimate();
  });
  call.on('error', () => closeOutgoingCall(participantId));
}

function closeOutgoingCall(participantId) {
  const call = outgoingCalls.get(participantId);
  if (!call) return;
  outgoingCalls.delete(participantId);
  call.close();
  presentationAudienceSize = Math.max(0, presentationAudienceSize - 1);
  updateBandwidthEstimate();
}

function closeAllOutgoingCalls() {
  const calls = [...outgoingCalls.values()];
  outgoingCalls.clear();
  for (const call of calls) call.close();
  presentationAudienceSize = 0;
  updateBandwidthEstimate();
}

function removeViewer(viewerId) {
  const entry = hostConnections.get(viewerId);
  if (!entry) return;
  hostConnections.delete(viewerId);
  entry.control.close();
  closeOutgoingCall(viewerId);

  if (activePresenterId === viewerId) {
    clearPresenter();
  } else if (activePresenterId && activePresenterId !== peer.id) {
    hostConnections.get(activePresenterId)?.control.send({ type: 'participant-left', peerId: viewerId });
  }
  updateViewerCount(hostConnections.size);
}

function reconnectPeer() {
  if (!peer?.destroyed) {
    try { peer.reconnect(); } catch {}
  }
}

function handleHostPeerError(error) {
  if (error.type === 'network' || error.type === 'server-error') {
    showToast('The signaling connection was interrupted.', 'error');
  }
}

function handleViewerPeerError(error) {
  const unavailable = error.type === 'peer-unavailable' || error.type === 'unavailable-id';
  endViewer(unavailable ? 'This room isn’t available.' : 'Could not connect to this room.');
}

function makeChatMessage({ sender, senderId = '', author, text }) {
  return {
    type: 'chat',
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    sender,
    senderId,
    author,
    text,
    sentAt: Date.now(),
  };
}

function rememberChatMessage(message) {
  chatHistory.push(message);
  if (chatHistory.length > 50) chatHistory.shift();
}

function broadcast(message) {
  for (const { control } of hostConnections.values()) {
    if (control.open) control.send(message);
  }
}

function loadChatHistory(messages) {
  if (!Array.isArray(messages)) return;
  for (const message of messages.slice(-50)) {
    if (message?.type === 'chat' && typeof message.text === 'string') appendChatMessage(message);
  }
}

function appendChatMessage(message) {
  const activeRoom = isRoomCreator ? hostRoom : viewerRoom;
  const container = activeRoom.querySelector('[data-chat-messages]');
  if (!container || container.querySelector(`[data-message-id="${CSS.escape(message.id)}"]`)) return;
  container.querySelector('[data-chat-empty]')?.remove();

  const isOwn = isRoomCreator
    ? message.sender === 'host'
    : message.sender === 'viewer' && message.senderId === peer?.id;
  const article = document.createElement('article');
  article.className = `chat-message${isOwn ? ' own' : ''}`;
  article.dataset.messageId = message.id;

  const header = document.createElement('header');
  const author = document.createElement('strong');
  const time = document.createElement('time');
  const body = document.createElement('p');
  author.textContent = isOwn ? 'You' : message.author;
  time.dateTime = new Date(message.sentAt).toISOString();
  time.textContent = new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' }).format(message.sentAt);
  body.textContent = message.text;
  header.append(author, time);
  article.append(header, body);
  container.append(article);

  while (container.querySelectorAll('.chat-message').length > 50) {
    container.querySelector('.chat-message')?.remove();
  }
  container.scrollTop = container.scrollHeight;
}

function sendChat(form) {
  const input = form.querySelector('[data-chat-input]');
  const text = input.value.trim().slice(0, 500);
  if (!text) return;

  if (isRoomCreator) {
    const message = makeChatMessage({ sender: 'host', author: 'Host', text });
    rememberChatMessage(message);
    appendChatMessage(message);
    broadcast(message);
  } else if (viewerControl?.open) {
    viewerControl.send({ type: 'chat', text });
  }
  input.value = '';
}

function setChatEnabled(enabled) {
  const form = viewerRoom.querySelector('[data-chat-form]');
  form.querySelector('input').disabled = !enabled;
  form.querySelector('button').disabled = !enabled;
}

async function applySenderQuality(call) {
  const sender = call?.peerConnection?.getSenders().find(({ track }) => track?.kind === 'video');
  if (!sender) return;
  const parameters = sender.getParameters();
  if (!parameters.encodings?.length) parameters.encodings = [{}];
  parameters.encodings[0].maxBitrate = currentStreamSettings.bitrate;
  parameters.encodings[0].maxFramerate = currentStreamSettings.frameRate;
  try { await sender.setParameters(parameters); } catch {}
}

async function applyStreamSettings(settings) {
  if (localStream) {
    const track = localStream.getVideoTracks()[0];
    const constraints = { frameRate: { ideal: settings.frameRate, max: settings.frameRate } };
    if (settings.width && settings.height) {
      constraints.width = { max: settings.width };
      constraints.height = { max: settings.height };
    }
    await track.applyConstraints(constraints);
    track.contentHint = settings.contentHint;
  }
  currentStreamSettings = { ...settings };
  await Promise.all([...outgoingCalls.values()].map((call) => applySenderQuality(call)));
  updateBandwidthEstimate();
}

async function setQuality(name) {
  const preset = qualityPresets[name];
  if (!preset) return;
  try {
    await applyStreamSettings(preset);
    currentQuality = name;
    setQualityTriggerLabel(preset.buttonLabel);
    document.querySelectorAll('[data-quality]').forEach((button) => {
      button.classList.toggle('active', button.dataset.quality === name);
    });
    syncAdvancedControls(preset);
    closeQualityMenu();
    showToast(`${preset.buttonLabel}: ${preset.label} at ${preset.frameRate} fps.`);
  } catch {
    showToast('This screen cannot use that quality setting.', 'error');
  }
}

function setQualityTriggerLabel(label) {
  $('#quality-label').textContent = label;
  $('#viewer-quality-label').textContent = label;
}

function syncAdvancedControls(settings) {
  $('#advanced-resolution').value = settings.width && settings.height
    ? `${settings.width}x${settings.height}`
    : 'native';
  $('#advanced-framerate').value = String(settings.frameRate);
  $('#advanced-content').value = settings.contentHint;
  $('#advanced-bitrate').value = String(settings.bitrate / 1_000_000);
  updateBitrateOutput();
}

function formatMbps(value) {
  return Number(value).toFixed(1).replace(/\.0$/, '');
}

function updateBitrateOutput() {
  const bitrate = Number($('#advanced-bitrate').value);
  $('#bitrate-output').textContent = `${formatMbps(bitrate)} Mbps`;
  updateBandwidthEstimate(bitrate * 1_000_000);
}

function updateBandwidthEstimate(bitrate = currentStreamSettings.bitrate) {
  const videoPerViewer = bitrate / 1_000_000;
  const audioPerViewer = localStream?.getAudioTracks().some((track) => track.readyState === 'live') ? 0.128 : 0;
  const estimatedPerViewer = (videoPerViewer + audioPerViewer) * 1.08;
  const audience = isLocalPresenter()
    ? isRoomCreator ? hostConnections.size : presentationAudienceSize
    : 0;
  $('#bandwidth-total').textContent = `≈${formatMbps(estimatedPerViewer * audience)} Mbps`;
  $('#bandwidth-detail').textContent = `${formatMbps(videoPerViewer)} Mbps video ceiling × ${audience} ${audience === 1 ? 'viewer' : 'viewers'}`;
  $('#bandwidth-capacity').textContent = `Room full: ≈${formatMbps(estimatedPerViewer * maxViewers)} Mbps including typical overhead${audioPerViewer ? ' and audio' : ''}`;
}

async function applyAdvancedSettings() {
  const resolution = $('#advanced-resolution').value;
  const [width, height] = resolution === 'native'
    ? [undefined, undefined]
    : resolution.split('x').map(Number);
  const settings = {
    width,
    height,
    frameRate: Number($('#advanced-framerate').value),
    bitrate: Number($('#advanced-bitrate').value) * 1_000_000,
    contentHint: $('#advanced-content').value,
    label: resolution === 'native' ? 'Source' : $('#advanced-resolution').selectedOptions[0].textContent,
    buttonLabel: 'Custom',
  };
  const button = $('#apply-advanced');
  button.disabled = true;
  try {
    await applyStreamSettings(settings);
    currentQuality = 'custom';
    setQualityTriggerLabel('Custom');
    document.querySelectorAll('[data-quality]').forEach((presetButton) => presetButton.classList.remove('active'));
    closeQualityMenu();
    showToast(`Custom: ${settings.label} at ${settings.frameRate} fps, ${formatMbps(settings.bitrate / 1_000_000)} Mbps.`);
  } catch {
    showToast('This screen cannot use those custom settings.', 'error');
  } finally {
    button.disabled = false;
  }
}

function closeQualityMenu() {
  qualityMenu.hidden = true;
  document.querySelectorAll('[data-quality-trigger]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
}

function toggleQualityMenu(button) {
  const willOpen = qualityMenu.hidden;
  closeQualityMenu();
  qualityMenu.hidden = !willOpen;
  button.setAttribute('aria-expanded', String(willOpen));
}

function updateViewerCount(count) {
  $('#viewer-count').textContent = `${count} ${count === 1 ? 'viewer' : 'viewers'}`;
  updateBandwidthEstimate();
}

function setViewerConnectionStatus(state, label) {
  $('#viewer-status-dot').className = `status-dot ${state}`;
  $('#viewer-status').textContent = label;
}

function setViewerState(state, message, detail) {
  setViewerConnectionStatus(state, state === 'ended' ? 'Offline' : 'Connected');
  $('#viewer-message').textContent = message;
  $('#viewer-detail').textContent = detail;
}

function endViewer(message) {
  if (viewerEnded) return;
  viewerEnded = true;
  closeIncomingCall();
  closeAllOutgoingCalls();
  discardLocalStream();
  viewerControl?.close();
  viewerControl = undefined;
  peer?.destroy();
  setChatEnabled(false);
  clearStage();
  $('#viewer-placeholder').classList.add('ended');
  setViewerState('ended', message, 'Return home to create or join another room.');
  $('#viewer-home').hidden = false;
  $('#viewer-share-button').disabled = true;
  $('#viewer-share-button').textContent = 'Room closed';
}

function closeRoom() {
  if (!isRoomCreator) return;
  if (!window.confirm('Close this room for everyone?')) return;
  broadcast({ type: 'room-closed' });
  closeIncomingCall();
  closeAllOutgoingCalls();
  discardLocalStream();
  for (const { control } of hostConnections.values()) control.close();
  hostConnections.clear();
  peer?.destroy();
  location.href = appPath();
}

async function copyShareLink() {
  const input = $('#share-link');
  try {
    await navigator.clipboard.writeText(input.value);
  } catch {
    input.select();
    document.execCommand('copy');
  }
  const label = $('#copy-button span');
  label.textContent = 'Copied';
  $('#copy-button').classList.add('copied');
  setTimeout(() => {
    label.textContent = 'Copy';
    $('#copy-button').classList.remove('copied');
  }, 1800);
}

async function copyRoomCode() {
  try {
    await navigator.clipboard.writeText(roomId);
    showToast('Room code copied.');
  } catch {
    const input = $('#share-link');
    const previous = input.value;
    input.value = roomId;
    input.select();
    document.execCommand('copy');
    input.value = previous;
    showToast('Room code copied.');
  }
}

$('#share-button').addEventListener('click', startSharing);
$('#stop-button').addEventListener('click', stopLocalPresentation);
$('#host-share-button').addEventListener('click', startRoomPresentation);
$('#close-room-button').addEventListener('click', closeRoom);
$('#viewer-share-button').addEventListener('click', () => {
  if (isLocalPresenter()) stopLocalPresentation();
  else startRoomPresentation();
});
$('#copy-button').addEventListener('click', copyShareLink);
$('#copy-code-button').addEventListener('click', copyRoomCode);
$('#viewer-home').addEventListener('click', () => { location.href = appPath(); });
$('#play-button').addEventListener('click', () => {
  viewerVideo.play();
  $('#play-button').hidden = true;
});
document.querySelectorAll('[data-chat-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    sendChat(form);
  });
});
document.querySelectorAll('[data-quality-trigger]').forEach((button) => {
  button.addEventListener('click', () => toggleQualityMenu(button));
});
document.querySelectorAll('[data-quality]').forEach((button) => {
  button.addEventListener('click', () => setQuality(button.dataset.quality));
});
$('#advanced-toggle').addEventListener('click', () => {
  const panel = $('#advanced-panel');
  panel.hidden = !panel.hidden;
  $('#advanced-toggle').setAttribute('aria-expanded', String(!panel.hidden));
});
$('#advanced-bitrate').addEventListener('input', updateBitrateOutput);
$('#apply-advanced').addEventListener('click', applyAdvancedSettings);
document.addEventListener('click', (event) => {
  if (!event.target.closest('[data-quality-trigger]') && !event.target.closest('#quality-menu')) closeQualityMenu();
});
$('#join-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const id = normalizeRoomCode($('#room-code').value);
  if (!id) return showToast('Enter a valid room code.', 'error');
  location.href = appPath(`room/${id}`);
});

const relativePath = location.pathname.startsWith(appBasePath)
  ? location.pathname.slice(appBasePath.length) || '/'
  : location.pathname;
const routeMatch = relativePath.match(/^\/room\/([a-z0-9-]{6,32})\/?$/i);
if (routeMatch) joinRoom(routeMatch[1].toLowerCase());
else setScreen('landing');
