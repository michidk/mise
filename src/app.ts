import type {
  DataConnection,
  MediaConnection,
  Peer as PeerInstance,
  PeerError,
  PeerJSOption,
} from 'peerjs';
import {
  createTextPresentation,
  TEXT_CODEC_ID,
  TextStreamReceiver,
  type TextCodecSettings,
  type TextPresentation,
} from './media/index.js';
import {
  parseHostRoomMessage,
  parsePresenter,
  parseViewerRoomMessage,
  RoomAdmission,
  RoomSession,
  type ActivityKind,
  type ChatActivity,
  type ChatEntry,
  type ChatMessage,
  type PresenterInfo,
} from './room/index.js';

declare const Peer: typeof PeerInstance;

type AppElement = HTMLElement & {
  disabled: boolean;
  select(): void;
  value: string;
};
type ToastTone = 'default' | 'error';
type QualityName = keyof typeof qualityPresets;

interface ViewerEntry {
  control: DataConnection;
  name: string;
  lastMessageAt: number;
}

const $ = <ElementType extends Element = AppElement>(selector: string) => {
  const element = document.querySelector<ElementType>(selector);
  if (!element) throw new Error(`Missing required element: ${selector}`);
  return element;
};

const landing = $('#landing');
const room = $('#room');
const streamGrid = $('#stream-grid');
const streamsEmpty = $('#streams-empty');
const qualityMenu = $('#quality-menu');
const toast = $('#toast');
const appBaseUrl = new URL(document.baseURI);
const appBasePath = appBaseUrl.pathname.replace(/\/$/, '');

const qualityPresets = {
  efficient: {
    codec: TEXT_CODEC_ID,
    frameRate: 4,
    compressionLevel: 8,
    tileSize: 128,
    label: 'Native pixels · 4 fps · DEFLATE 8',
    buttonLabel: 'Text efficient',
  },
  balanced: {
    codec: TEXT_CODEC_ID,
    frameRate: 6,
    compressionLevel: 6,
    tileSize: 128,
    label: 'Native pixels · 6 fps · DEFLATE 6',
    buttonLabel: 'Lossless text',
  },
  responsive: {
    codec: TEXT_CODEC_ID,
    frameRate: 10,
    compressionLevel: 4,
    tileSize: 128,
    label: 'Native pixels · 10 fps · DEFLATE 4',
    buttonLabel: 'Text responsive',
  },
} satisfies Record<string, TextCodecSettings>;

let peer: PeerInstance | undefined;
const session = new RoomSession();
const admission = new RoomAdmission();
let viewerControl: DataConnection | undefined;
let localPresentation: TextPresentation | undefined;
let shareAudioEnabled = false;
let maxViewers = 5;
let guestNumber = 0;
let currentQuality: QualityName = 'balanced';
let currentStreamSettings: TextCodecSettings = { ...qualityPresets.balanced };
let rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: ['stun:main.lohr.dev:3478', 'stun:stun.l.google.com:19302'] }],
};
let chatAudioContext: AudioContext | undefined;
let chatSoundsEnabled = readChatSoundsEnabled();
let toastTimer: ReturnType<typeof setTimeout> | undefined;

const hostConnections = new Map<string, ViewerEntry>();
const presenters = new Map<string, PresenterInfo>();
const incomingTextConnections = new Map<string, DataConnection>();
const incomingAudioCalls = new Map<string, MediaConnection>();
const remoteAudioElements = new Map<string, HTMLAudioElement>();
const mutedPresenters = new Set<string>();
const chatHistory: ChatEntry[] = [];

const configReady = fetch(appPath('config'))
  .then((response) => response.json())
  .then((config: { iceServers: RTCIceServer[]; maxViewers: number }) => {
    rtcConfig = { iceServers: config.iceServers };
    maxViewers = config.maxViewers;
    updateBandwidthEstimate();
  })
  .catch(() => {});

function appPath(pathname = ''): string {
  const suffix = pathname.replace(/^\/+/, '');
  return `${appBasePath}/${suffix}` || '/';
}

function setScreen(screen: 'landing' | 'room') {
  landing.hidden = screen !== 'landing';
  room.hidden = screen !== 'room';
  document.body.dataset.screen = screen;
}

function showToast(message: string, tone: ToastTone = 'default') {
  toast.textContent = message;
  toast.dataset.tone = tone;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

function makeRoomId() {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const code = Array.from(bytes, (byte) => alphabet[byte & 31]).join('');
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

function normalizeRoomCode(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '');
  return normalized.match(/(?:room\/)?([a-z0-9-]{6,32})\/?$/)?.[1] || '';
}

function peerOptions(): PeerJSOption {
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

function waitForPeerOpen(instance: PeerInstance): Promise<string> {
  return new Promise((resolve, reject) => {
    const onOpen = (id: string) => {
      instance.off('error', onError);
      resolve(id);
    };
    const onError = (error: PeerError<string>) => {
      instance.off('open', onOpen);
      reject(error);
    };
    instance.once('open', onOpen);
    instance.once('error', onError);
  });
}

async function captureDisplay() {
  if (!navigator.mediaDevices?.getDisplayMedia) throw new Error('Screen sharing is not supported in this browser.');
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: { ideal: currentStreamSettings.frameRate, max: Math.max(12, currentStreamSettings.frameRate) } },
    audio: shareAudioEnabled,
  });
  const videoTrack = stream.getVideoTracks()[0];
  videoTrack.contentHint = 'detail';
  videoTrack.onended = () => stopLocalPresentation();
  if (shareAudioEnabled && stream.getAudioTracks().length === 0) {
    showToast('Audio was not available for the selected screen.', 'error');
  }
  return stream;
}

async function startSharing() {
  const button = $('#share-button');
  button.disabled = true;
  button.classList.add('loading');
  setShareAudioControlsDisabled(true);
  try {
    const captured = await captureDisplay();
    await configReady;
    session.startHosting(makeRoomId());
    admission.startHost(session.roomId);
    history.replaceState({}, '', appPath(`room/${session.roomId}`));
    prepareRoomShell();
    setRoomConnectionState('waiting', 'Opening room');

    peer = new Peer(session.roomId, peerOptions());
    peer.on('connection', routeDataConnection);
    peer.on('call', receiveAudioCall);
    peer.on('error', handleHostPeerError);
    peer.on('disconnected', reconnectPeer);
    await waitForPeerOpen(peer);
    session.markLive();
    setChatEnabled(true);
    setRoomConnectionState('live', 'Host · room open');
    announceSystem('Host', 'joined the room.', 'joined');
    await beginLocalPresentation(captured);
  } catch (error: unknown) {
    disposeLocalPresentation();
    peer?.destroy();
    peer = undefined;
    session.reset();
    admission.reset();
    setScreen('landing');
    history.replaceState({}, '', appPath());
    if (errorName(error) !== 'NotAllowedError') {
      showToast(errorMessage(error, 'Could not start the room.'), 'error');
    }
  } finally {
    button.disabled = false;
    button.classList.remove('loading');
    setShareAudioControlsDisabled(Boolean(localPresentation));
  }
}

async function joinRoom(id: string) {
  session.startJoining(id);
  admission.startViewer(id);
  prepareRoomShell();
  setRoomConnectionState('waiting', 'Connecting to host');
  await configReady;
  peer = new Peer(peerOptions());
  peer.on('connection', routeDataConnection);
  peer.on('call', receiveAudioCall);
  peer.on('error', handleViewerPeerError);
  peer.on('disconnected', reconnectPeer);
  try {
    await waitForPeerOpen(peer);
    viewerControl = peer.connect(session.roomId, {
      metadata: { role: 'viewer', version: 4 },
      serialization: 'json',
      reliable: true,
    });
    viewerControl.on('open', () => setRoomConnectionState('waiting', 'Waiting for host'));
    viewerControl.on('data', handleRoomMessage);
    viewerControl.on('close', () => {
      if (!peer?.destroyed) endViewer('The room is no longer available.');
    });
    viewerControl.on('error', () => endViewer('Could not reach the room host.'));
  } catch (error: unknown) {
    handleViewerPeerError(error);
  }
}

function prepareRoomShell() {
  $('#room-code-display').textContent = session.roomId;
  $('#room-title').textContent = `Room ${session.roomId}`;
  $('#leave-room-button span').textContent = session.isHost ? 'Close room' : 'Leave room';
  setScreen('room');
  updateParticipantCount(session.isHost ? 1 : 0);
  updateRoomUI();
}

function routeDataConnection(connection: DataConnection) {
  if (connection.metadata?.role === 'viewer' && session.isHost) {
    acceptViewer(connection);
    return;
  }
  if (connection.metadata?.role === 'text-stream') {
    acceptTextStream(connection);
    return;
  }
  connection.close();
}

function acceptViewer(connection: DataConnection) {
  const viewerId = connection.peer;
  if (hostConnections.has(viewerId)) {
    connection.close();
    return;
  }
  if (hostConnections.size >= maxViewers) {
    connection.on('open', () => {
      connection.send({ type: 'room-full' });
      setTimeout(() => connection.close(), 100);
    });
    return;
  }
  guestNumber += 1;
  const credential = admission.admit(viewerId);
  hostConnections.set(viewerId, { control: connection, name: `Guest ${guestNumber}`, lastMessageAt: 0 });
  connection.on('open', () => {
    const viewer = hostConnections.get(viewerId);
    if (!viewer || !peer) return;
    connection.send({
      type: 'accepted',
      name: viewer.name,
      hostId: peer.id,
      mediaToken: credential.mediaToken,
      participants: admission.credentials(viewerId),
    });
    for (const [participantId, participant] of hostConnections) {
      if (participantId !== viewerId && participant.control.open) {
        participant.control.send({ type: 'participant-authorized', participant: credential });
      }
    }
    connection.send({ type: 'chat-history', messages: chatHistory });
    connection.send({ type: 'room-state', presenters: [...presenters.values()] });
    announceSystem(viewer.name, 'joined the room.', 'joined');
    broadcastParticipantCount();
    for (const presenter of presenters.values()) {
      if (presenter.id === peer.id) connectLocalStreamTo(viewerId);
      else hostConnections.get(presenter.id)?.control.send({ type: 'participant-joined', peerId: viewerId });
    }
  });
  connection.on('data', (value) => handleViewerData(viewerId, value));
  connection.on('close', () => removeViewer(viewerId, connection));
  connection.on('error', () => removeViewer(viewerId, connection));
}

function handleRoomMessage(value: unknown) {
  const message = parseHostRoomMessage(value, session.hostId);
  if (!message) return;
  switch (message.type) {
    case 'room-full':
      endViewer('This room has reached its participant limit.');
      break;
    case 'room-closed':
      endViewer('The room was closed by its host.');
      break;
    case 'accepted':
      if (!peer?.id || !admission.accept(peer.id, message.mediaToken, message.participants)) {
        endViewer('The room admission response was invalid.');
        break;
      }
      session.markLive({ viewerName: message.name, hostId: message.hostId });
      setChatEnabled(true);
      setRoomConnectionState('live', `${session.viewerName} · connected`);
      updateRoomUI();
      break;
    case 'participant-authorized':
      admission.authorize(message.participant);
      break;
    case 'chat-history':
      loadChatHistory(message.messages);
      break;
    case 'chat':
      appendChatEntry(message);
      break;
    case 'chat-activity':
      appendChatEntry(message);
      break;
    case 'participant-count':
      updateParticipantCount(message.participantCount);
      break;
    case 'room-state':
      for (const presenter of message.presenters) upsertPresenter(presenter);
      break;
    case 'stream-started':
      upsertPresenter(message.presenter);
      break;
    case 'stream-stopped':
      if (message.presenterId) removePresenter(message.presenterId);
      break;
    case 'stream-settings':
    case 'stream-audio':
      upsertPresenter(message.presenter);
      break;
    case 'share-approved':
      session.finishPresentation();
      connectLocalStreamToParticipants(message.participants);
      updateRoomUI();
      break;
    case 'participant-joined':
      if (localPresentation) connectLocalStreamTo(message.peerId);
      break;
    case 'participant-left':
      admission.revoke(message.peerId);
      disconnectLocalStreamFrom(message.peerId);
      if (presenters.has(message.peerId)) removePresenter(message.peerId);
      break;
  }
}

function handleViewerData(viewerId: string, value: unknown) {
  const message = parseViewerRoomMessage(value);
  if (!message) return;
  const viewer = hostConnections.get(viewerId);
  if (!viewer) return;

  if (message.type === 'stream-started') {
    const settings = message.streamSettings || qualityPresets.balanced;
    const presenter: PresenterInfo = {
      id: viewerId,
      name: viewer.name,
      isHost: false,
      audioEnabled: message.audioEnabled,
      settings,
    };
    upsertPresenter(presenter);
    broadcast({ type: 'stream-started', presenter });
    announceSystem(viewer.name, 'started sharing.', 'stream-started');
    const participants = [peer?.id, ...hostConnections.keys()].filter((id): id is string => Boolean(id && id !== viewerId));
    viewer.control.send({ type: 'share-approved', participants });
    return;
  }
  if (message.type === 'stop-presenting') {
    if (!presenters.has(viewerId)) return;
    removePresenter(viewerId);
    broadcast({ type: 'stream-stopped', presenterId: viewerId });
    announceSystem(viewer.name, 'stopped sharing.', 'stream-stopped');
    return;
  }
  if (message.type === 'settings-changed') {
    const settings = message.streamSettings;
    const presenter = presenters.get(viewerId);
    if (!presenter) return;
    const updated = { ...presenter, settings };
    upsertPresenter(updated);
    broadcast({ type: 'stream-settings', presenter: updated });
    announceSystem(viewer.name, `changed stream settings to ${settings.buttonLabel} (${settings.label}).`, 'settings');
    return;
  }
  if (message.type === 'audio-changed') {
    const presenter = presenters.get(viewerId);
    if (!presenter) return;
    const updated = { ...presenter, audioEnabled: message.audioEnabled };
    upsertPresenter(updated);
    broadcast({ type: 'stream-audio', presenter: updated });
    announceSystem(viewer.name, message.audioEnabled ? 'resumed stream audio.' : 'stopped sending stream audio.', 'audio');
    return;
  }
  if (message.type === 'settings-selected') {
    const settings = message.streamSettings;
    announceSystem(viewer.name, `selected ${settings.buttonLabel} (${settings.label}) for their next stream.`, 'settings');
    return;
  }
  if (message.type !== 'chat') return;
  const text = message.text.trim();
  const now = Date.now();
  if (!text || now - viewer.lastMessageAt < 300) return;
  viewer.lastMessageAt = now;
  const chatMessage = makeChatMessage({ sender: 'viewer', senderId: viewerId, author: viewer.name, text });
  rememberChatEntry(chatMessage);
  appendChatEntry(chatMessage);
  broadcast(chatMessage);
}

async function startRoomPresentation() {
  if (localPresentation || session.ended || !peer?.id || !session.beginPresentation()) return;
  updateRoomUI();
  setShareAudioControlsDisabled(true);
  try {
    const stream = await captureDisplay();
    await beginLocalPresentation(stream);
  } catch (error: unknown) {
    session.finishPresentation();
    disposeLocalPresentation();
    updateRoomUI();
    if (errorName(error) !== 'NotAllowedError') showToast(errorMessage(error, 'Could not share this screen.'), 'error');
  }
}

async function beginLocalPresentation(stream: MediaStream) {
  if (!peer?.id) throw new Error('The room connection is not ready.');
  try {
    localPresentation = createTextPresentation(stream, currentStreamSettings);
  } catch (error) {
    stopMediaStream(stream);
    throw error;
  }
  const presenter = localPresenterInfo();
  upsertPresenter(presenter);
  attachLocalPreview(stream, presenter.id);
  await localPresentation.start();

  if (session.isHost) {
    session.finishPresentation();
    broadcast({ type: 'stream-started', presenter });
    announceSystem('Host', 'started sharing.', 'stream-started');
    connectLocalStreamToParticipants([...hostConnections.keys()]);
  } else if (viewerControl?.open) {
    viewerControl.send({
      type: 'stream-started',
      streamSettings: currentStreamSettings,
      audioEnabled: presenter.audioEnabled,
    });
  } else {
    throw new Error('The room connection is not ready.');
  }
  updateRoomUI();
}

function localPresenterInfo(): PresenterInfo {
  return {
    id: peer?.id || '',
    name: session.isHost ? 'Host' : session.viewerName || 'You',
    isHost: session.isHost,
    audioEnabled: localAudioTracks().some((track) => track.enabled),
    settings: { ...currentStreamSettings },
  };
}

function connectLocalStreamToParticipants(participantIds: string[]) {
  for (const participantId of participantIds) connectLocalStreamTo(participantId);
  updateBandwidthEstimate();
}

function connectLocalStreamTo(participantId: string) {
  if (!peer || !localPresentation) return;
  localPresentation.connect(peer, participantId, localPresenterInfo(), admission.localMediaToken);
  updateBandwidthEstimate();
}

function disconnectLocalStreamFrom(participantId: string) {
  localPresentation?.disconnect(participantId);
  updateBandwidthEstimate();
}

function acceptTextStream(connection: DataConnection) {
  const presenter = parsePresenter(connection.metadata?.presenter, session.hostId);
  if (!admission.isAuthorized(connection.peer, connection.metadata?.mediaToken)
    || !presenter || presenter.id !== connection.peer || presenter.id === peer?.id) return connection.close();
  upsertPresenter(presenter);
  incomingTextConnections.get(presenter.id)?.close();
  incomingTextConnections.set(presenter.id, connection);
  const canvas = streamCardMedia<HTMLCanvasElement>(presenter.id, 'canvas');
  if (!canvas) return connection.close();
  new TextStreamReceiver(canvas, connection, () => setCardConnected(presenter.id));
  connection.on('close', () => {
    if (incomingTextConnections.get(presenter.id) === connection) incomingTextConnections.delete(presenter.id);
  });
}

function receiveAudioCall(call: MediaConnection) {
  const presenter = parsePresenter(call.metadata?.presenter, session.hostId);
  if (call.metadata?.role !== 'presenter-audio'
    || !admission.isAuthorized(call.peer, call.metadata?.mediaToken)
    || !presenter || presenter.id !== call.peer || presenter.id === peer?.id) {
    call.close();
    return;
  }
  upsertPresenter(presenter);
  incomingAudioCalls.get(presenter.id)?.close();
  incomingAudioCalls.set(presenter.id, call);
  call.answer();
  call.on('stream', (stream) => {
    const audio = remoteAudioElements.get(presenter.id) || document.createElement('audio');
    audio.autoplay = true;
    audio.srcObject = stream;
    audio.muted = mutedPresenters.has(presenter.id);
    remoteAudioElements.set(presenter.id, audio);
    void audio.play().catch(() => showToast(`Click ${presenter.name}’s mute button to enable audio.`));
  });
  call.on('close', () => closeIncomingAudio(presenter.id, call));
  call.on('error', () => closeIncomingAudio(presenter.id, call));
}

function closeIncomingAudio(presenterId: string, expected?: MediaConnection) {
  const call = incomingAudioCalls.get(presenterId);
  if (!call || (expected && call !== expected)) return;
  incomingAudioCalls.delete(presenterId);
  call.close();
  const audio = remoteAudioElements.get(presenterId);
  if (audio) audio.srcObject = null;
  remoteAudioElements.delete(presenterId);
}

function stopLocalPresentation() {
  if (!localPresentation) return;
  const presenterId = peer?.id;
  disposeLocalPresentation();
  session.finishPresentation();
  if (presenterId) removePresenter(presenterId);

  if (presenterId) {
    if (session.isHost) {
      broadcast({ type: 'stream-stopped', presenterId });
      announceSystem('Host', 'stopped sharing.', 'stream-stopped');
    } else {
      viewerControl?.send({ type: 'stop-presenting' });
    }
  } else if (!session.isHost) {
    viewerControl?.send({ type: 'stop-presenting' });
  }
  updateBandwidthEstimate();
  updateRoomUI();
}

function disposeLocalPresentation() {
  const presentation = localPresentation;
  localPresentation = undefined;
  presentation?.stop();
  setShareAudioControlsDisabled(false);
}

function stopMediaStream(stream: MediaStream) {
  for (const track of stream.getTracks()) {
    track.onended = null;
    track.stop();
  }
}

function localAudioTracks() {
  return localPresentation?.audioTracks() || [];
}

function toggleLocalAudio() {
  const tracks = localAudioTracks();
  if (!tracks.length) return;
  const enabled = !tracks.some((track) => track.enabled);
  localPresentation?.setAudioEnabled(enabled);
  const presenter = localPresenterInfo();
  upsertPresenter(presenter);
  if (session.isHost) {
    broadcast({ type: 'stream-audio', presenter });
    announceSystem('Host', enabled ? 'resumed stream audio.' : 'stopped sending stream audio.', 'audio');
  } else {
    viewerControl?.send({ type: 'audio-changed', audioEnabled: enabled });
  }
  updateRoomUI();
  updateBandwidthEstimate();
  showToast(enabled ? 'Stream audio resumed.' : 'Stream audio stopped.');
}

function upsertPresenter(presenter: PresenterInfo) {
  presenters.set(presenter.id, presenter);
  renderStreamCard(presenter);
  updateStreamGrid();
}

function removePresenter(presenterId: string) {
  presenters.delete(presenterId);
  incomingTextConnections.get(presenterId)?.close();
  incomingTextConnections.delete(presenterId);
  closeIncomingAudio(presenterId);
  mutedPresenters.delete(presenterId);
  streamGrid.querySelector(`[data-presenter-id="${CSS.escape(presenterId)}"]`)?.remove();
  updateStreamGrid();
}

function renderStreamCard(presenter: PresenterInfo) {
  let card = streamGrid.querySelector<HTMLElement>(`[data-presenter-id="${CSS.escape(presenter.id)}"]`);
  const isLocal = presenter.id === peer?.id;
  if (!card) {
    card = document.createElement('article');
    card.className = 'stream-card connecting';
    card.dataset.presenterId = presenter.id;
    const media = document.createElement('div');
    media.className = 'stream-card-media';
    const visual = document.createElement(isLocal ? 'video' : 'canvas');
    visual.setAttribute('playsinline', '');
    if (visual instanceof HTMLVideoElement) {
      visual.autoplay = true;
      visual.muted = true;
    }
    const loading = document.createElement('div');
    loading.className = 'stream-connecting';
    loading.innerHTML = '<span></span><b>Connecting stream…</b>';
    media.append(visual, loading);

    const footer = document.createElement('footer');
    footer.innerHTML = `
      <div class="stream-person"><span class="stream-avatar"></span><span><strong></strong><small></small></span></div>
      <div class="stream-card-actions"><span class="audio-state"></span><button class="stream-mute" type="button"><svg viewBox="0 0 24 24"><path d="M11 5 6.5 9H3v6h3.5L11 19V5ZM15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/><path class="muted-line" d="m4 4 16 16"/></svg><span></span></button></div>`;
    footer.querySelector<HTMLButtonElement>('.stream-mute')?.addEventListener('click', () => toggleRemoteMute(presenter.id));
    card.append(media, footer);
    streamGrid.append(card);
  }
  card.classList.toggle('local-stream', isLocal);
  card.classList.toggle('host-stream', presenter.isHost);
  const avatar = card.querySelector('.stream-avatar');
  const name = card.querySelector('.stream-person strong');
  const settings = card.querySelector('.stream-person small');
  const audioState = card.querySelector('.audio-state');
  if (avatar) avatar.textContent = initials(presenter.name);
  if (name) name.textContent = `${presenter.name}${presenter.isHost ? ' · Host' : ''}${isLocal ? ' · You' : ''}`;
  if (settings) settings.textContent = `${presenter.settings.buttonLabel} · ${presenter.settings.label}`;
  if (audioState) {
    audioState.textContent = presenter.audioEnabled ? 'Audio on' : 'No audio';
    audioState.classList.toggle('off', !presenter.audioEnabled);
  }
  updateMuteButton(presenter.id);
}

function attachLocalPreview(stream: MediaStream, presenterId: string) {
  const video = streamCardMedia<HTMLVideoElement>(presenterId, 'video');
  if (!video) return;
  video.srcObject = stream;
  void video.play().then(() => setCardConnected(presenterId)).catch(() => {});
}

function streamCardMedia<ElementType extends HTMLVideoElement | HTMLCanvasElement>(presenterId: string, tag: 'video' | 'canvas') {
  return streamGrid.querySelector<ElementType>(`[data-presenter-id="${CSS.escape(presenterId)}"] ${tag}`);
}

function setCardConnected(presenterId: string) {
  streamGrid.querySelector(`[data-presenter-id="${CSS.escape(presenterId)}"]`)?.classList.remove('connecting');
}

function toggleRemoteMute(presenterId: string) {
  if (presenterId === peer?.id) return;
  if (mutedPresenters.has(presenterId)) mutedPresenters.delete(presenterId);
  else mutedPresenters.add(presenterId);
  const audio = remoteAudioElements.get(presenterId);
  if (audio) {
    audio.muted = mutedPresenters.has(presenterId);
    if (!audio.muted) void audio.play().catch(() => {});
  }
  updateMuteButton(presenterId);
}

function updateMuteButton(presenterId: string) {
  const button = streamGrid.querySelector<HTMLButtonElement>(`[data-presenter-id="${CSS.escape(presenterId)}"] .stream-mute`);
  if (!button) return;
  const isLocal = presenterId === peer?.id;
  const muted = isLocal || mutedPresenters.has(presenterId);
  button.classList.toggle('muted', muted);
  button.disabled = isLocal;
  button.setAttribute('aria-pressed', String(muted));
  button.setAttribute('aria-label', isLocal ? 'Your preview is muted' : muted ? 'Unmute this stream' : 'Mute this stream');
  const label = button.querySelector('span');
  if (label) label.textContent = isLocal ? 'Preview muted' : muted ? 'Unmute' : 'Mute';
}

function updateStreamGrid() {
  const count = presenters.size;
  streamsEmpty.hidden = count > 0;
  streamGrid.hidden = count === 0;
  streamGrid.dataset.count = String(count);
  $('#stream-count').textContent = count ? `${count} active ${count === 1 ? 'stream' : 'streams'}` : 'No active streams';
  updateRoomUI();
}

function updateRoomUI() {
  const sharing = Boolean(localPresentation);
  const streamButton = $('#stream-button');
  streamButton.disabled = session.ended || session.presentationPending || (!session.isHost && !viewerControl?.open);
  streamButton.classList.toggle('stop-stream', sharing);
  const streamButtonLabel = streamButton.querySelector('span');
  if (streamButtonLabel) streamButtonLabel.textContent = sharing ? 'Stop sharing' : session.presentationPending ? 'Opening picker…' : 'Start sharing';
  $('#your-stream-status').textContent = sharing
    ? `${currentStreamSettings.buttonLabel} · ${localAudioTracks().some((track) => track.enabled) ? 'audio on' : 'audio off'}`
    : session.presentationPending ? 'Starting…' : 'Not sharing';
  $('#share-audio-option').hidden = sharing;
  const audioButton = $('#local-audio-button');
  const hasAudio = localAudioTracks().length > 0;
  const audioEnabled = localAudioTracks().some((track) => track.enabled);
  audioButton.hidden = !sharing || !hasAudio;
  audioButton.classList.toggle('muted', hasAudio && !audioEnabled);
  const label = audioButton.querySelector('span');
  if (label) label.textContent = audioEnabled ? 'Stop audio' : 'Resume audio';
}

function setRoomConnectionState(state: 'waiting' | 'live' | 'ended', label: string) {
  $('#room-status-dot').className = `status-dot ${state}`;
  $('#room-kicker').textContent = label;
}

function updateParticipantCount(count: number) {
  if (!session.setParticipantCount(count)) return;
  const label = `${session.participantCount} ${session.participantCount === 1 ? 'participant' : 'participants'}`;
  document.querySelectorAll('[data-participant-count]').forEach((element) => { element.textContent = label; });
  updateBandwidthEstimate();
}

function broadcastParticipantCount() {
  updateParticipantCount(hostConnections.size + 1);
  broadcast({ type: 'participant-count', participantCount: hostConnections.size + 1 });
}

function removeViewer(viewerId: string, expectedConnection?: DataConnection) {
  const viewer = hostConnections.get(viewerId);
  if (!viewer || (expectedConnection && viewer.control !== expectedConnection)) return;
  hostConnections.delete(viewerId);
  admission.revoke(viewerId);
  viewer.control.close();
  disconnectLocalStreamFrom(viewerId);
  if (presenters.has(viewerId)) {
    removePresenter(viewerId);
    broadcast({ type: 'stream-stopped', presenterId: viewerId });
    announceSystem(viewer.name, 'stopped sharing.', 'stream-stopped');
  }
  for (const { control } of hostConnections.values()) control.send({ type: 'participant-left', peerId: viewerId });
  announceSystem(viewer.name, 'left the room.', 'left');
  broadcastParticipantCount();
}

async function setQuality(name: QualityName) {
  const settings = qualityPresets[name];
  currentQuality = name;
  currentStreamSettings = { ...settings };
  localPresentation?.updateSettings(currentStreamSettings);
  const videoTrack = localPresentation?.videoTrack;
  if (videoTrack) {
    try { await videoTrack.applyConstraints({ frameRate: { ideal: settings.frameRate, max: Math.max(12, settings.frameRate) } }); } catch {}
  }
  $('#quality-label').textContent = settings.buttonLabel;
  document.querySelectorAll<HTMLElement>('[data-quality]').forEach((button) => {
    button.classList.toggle('active', button.dataset.quality === name);
  });
  if (localPresentation) {
    const presenter = localPresenterInfo();
    upsertPresenter(presenter);
    if (session.isHost) {
      broadcast({ type: 'stream-settings', presenter });
      announceSystem('Host', `changed stream settings to ${settings.buttonLabel} (${settings.label}).`, 'settings');
    } else {
      viewerControl?.send({ type: 'settings-changed', streamSettings: settings });
    }
  } else if (!room.hidden) {
    if (session.isHost) {
      announceSystem('Host', `selected ${settings.buttonLabel} (${settings.label}) for their next stream.`, 'settings');
    } else {
      viewerControl?.send({ type: 'settings-selected', streamSettings: settings });
    }
  }
  closeQualityMenu();
  showToast(`${settings.buttonLabel}: ${settings.label}.`);
}

function updateBandwidthEstimate() {
  const audience = localPresentation ? Math.max(0, session.participantCount - 1) : 0;
  const lastFrameEstimate = currentStreamSettings.frameRate * 0.35;
  const estimated = lastFrameEstimate * audience;
  $('#bandwidth-total').textContent = `≈${formatMbps(estimated)} Mbps`;
  $('#bandwidth-detail').textContent = `Content-dependent lossless deltas × ${audience} ${audience === 1 ? 'peer' : 'peers'}`;
  $('#bandwidth-capacity').textContent = `Text mode is lossless; motion can use substantially more bandwidth.`;
}

function formatMbps(value: number) {
  return value.toFixed(1).replace(/\.0$/, '');
}

function closeQualityMenu() {
  qualityMenu.hidden = true;
  document.querySelectorAll('[data-quality-trigger]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
}

function toggleQualityMenu(button: HTMLElement) {
  const willOpen = qualityMenu.hidden;
  closeQualityMenu();
  qualityMenu.hidden = !willOpen;
  button.setAttribute('aria-expanded', String(willOpen));
}

function makeChatMessage({ sender, senderId = '', author, text }: {
  sender: 'host' | 'viewer';
  senderId?: string;
  author: string;
  text: string;
}): ChatMessage {
  return { type: 'chat', id: makeId(), sender, senderId, author, text, sentAt: Date.now() };
}

function makeActivity(author: string, text: string, activity: ActivityKind): ChatActivity {
  return { type: 'chat-activity', id: makeId(), activity, author, text, occurredAt: Date.now() };
}

function announceSystem(author: string, text: string, activity: ActivityKind) {
  if (!session.isHost) return;
  const entry = makeActivity(author, text, activity);
  rememberChatEntry(entry);
  appendChatEntry(entry);
  broadcast(entry);
}

function makeId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}

function rememberChatEntry(entry: ChatEntry) {
  chatHistory.push(entry);
  if (chatHistory.length > 100) chatHistory.shift();
}

function broadcast(message: object) {
  for (const { control } of hostConnections.values()) {
    if (control.open) control.send(message);
  }
}

function loadChatHistory(messages: ChatEntry[]) {
  for (const entry of messages) appendChatEntry(entry, false);
}

function appendChatEntry(entry: ChatEntry, playSound = true) {
  if (entry.type === 'chat-activity') appendChatActivity(entry, playSound);
  else appendChatMessage(entry, playSound);
}

function appendChatActivity(activity: ChatActivity, playSound = true) {
  const container = room.querySelector<HTMLElement>('[data-chat-messages]');
  if (!container || container.querySelector(`[data-message-id="${CSS.escape(activity.id)}"]`)) return;
  container.querySelector('[data-chat-empty]')?.remove();
  const item = document.createElement('div');
  item.className = `chat-activity activity-${activity.activity}`;
  item.dataset.messageId = activity.id;
  const icon = document.createElement('i');
  const text = document.createElement('span');
  const author = document.createElement('strong');
  const time = document.createElement('time');
  author.textContent = activity.author;
  text.append(author, ` ${activity.text}`);
  time.dateTime = new Date(activity.occurredAt).toISOString();
  time.dataset.elapsedAt = String(activity.occurredAt);
  time.textContent = formatElapsedTime(activity.occurredAt);
  item.append(icon, text, time);
  container.append(item);
  trimChatEntries(container);
  container.scrollTop = container.scrollHeight;
  if (playSound) playChatSound();
}

function appendChatMessage(message: ChatMessage, playSound = true) {
  const container = room.querySelector<HTMLElement>('[data-chat-messages]');
  if (!container || container.querySelector(`[data-message-id="${CSS.escape(message.id)}"]`)) return;
  container.querySelector('[data-chat-empty]')?.remove();
  const isOwn = session.isHost ? message.sender === 'host' : message.senderId === peer?.id;
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
  trimChatEntries(container);
  container.scrollTop = container.scrollHeight;
  if (playSound) playChatSound();
}

function sendChat(form: HTMLFormElement) {
  const input = form.querySelector<HTMLInputElement>('[data-chat-input]');
  if (!input) return;
  const text = input.value.trim().slice(0, 500);
  if (!text) return;
  if (session.isHost) {
    const message = makeChatMessage({ sender: 'host', author: 'Host', text });
    rememberChatEntry(message);
    appendChatEntry(message);
    broadcast(message);
  } else if (viewerControl?.open) {
    viewerControl.send({ type: 'chat', text });
  }
  input.value = '';
}

function trimChatEntries(container: HTMLElement) {
  while (container.querySelectorAll('[data-message-id]').length > 100) container.querySelector('[data-message-id]')?.remove();
}

function setChatEnabled(enabled: boolean) {
  const form = room.querySelector<HTMLFormElement>('[data-chat-form]');
  const input = form?.querySelector<HTMLInputElement>('input');
  const button = form?.querySelector<HTMLButtonElement>('button');
  if (input) input.disabled = !enabled;
  if (button) button.disabled = !enabled;
}

function formatElapsedTime(timestamp: number) {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`;
}

function updateElapsedTimes() {
  document.querySelectorAll<HTMLTimeElement>('[data-elapsed-at]').forEach((time) => {
    const timestamp = Number(time.dataset.elapsedAt);
    if (Number.isFinite(timestamp)) time.textContent = formatElapsedTime(timestamp);
  });
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function readChatSoundsEnabled() {
  try { return localStorage.getItem('mise-chat-sounds') !== 'off'; } catch { return true; }
}

function syncChatSoundButtons() {
  const action = chatSoundsEnabled ? 'Mute notification sounds' : 'Enable notification sounds';
  document.querySelectorAll<HTMLButtonElement>('[data-chat-sound-toggle]').forEach((button) => {
    button.setAttribute('aria-pressed', String(chatSoundsEnabled));
    button.setAttribute('aria-label', action);
    button.title = action;
  });
}

function toggleChatSounds() {
  chatSoundsEnabled = !chatSoundsEnabled;
  try { localStorage.setItem('mise-chat-sounds', chatSoundsEnabled ? 'on' : 'off'); } catch {}
  syncChatSoundButtons();
  if (chatSoundsEnabled) prepareChatAudio();
}

function prepareChatAudio() {
  if (!chatSoundsEnabled) return;
  try {
    chatAudioContext ||= new AudioContext();
    if (chatAudioContext.state === 'suspended') void chatAudioContext.resume();
  } catch {}
}

function playChatSound() {
  if (!chatSoundsEnabled || !chatAudioContext) return;
  try {
    const context = chatAudioContext;
    const play = () => {
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.setValueAtTime(620, now);
      oscillator.frequency.exponentialRampToValueAtTime(820, now + 0.09);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.16);
    };
    if (context.state === 'suspended') void context.resume().then(play).catch(() => {});
    else play();
  } catch {}
}

function reconnectPeer() {
  if (peer && !peer.destroyed) {
    try { peer.reconnect(); } catch {}
  }
}

function handleHostPeerError(error: PeerError<string>) {
  if (error.type === 'network' || error.type === 'server-error') showToast('The signaling connection was interrupted.', 'error');
}

function handleViewerPeerError(error: unknown) {
  const type = peerErrorType(error);
  endViewer(type === 'peer-unavailable' || type === 'unavailable-id' ? 'This room isn’t available.' : 'Could not connect to this room.');
}

function endViewer(message: string) {
  if (!session.end()) return;
  stopLocalPresentation();
  for (const connection of incomingTextConnections.values()) connection.close();
  incomingTextConnections.clear();
  for (const call of incomingAudioCalls.values()) call.close();
  incomingAudioCalls.clear();
  viewerControl?.close();
  viewerControl = undefined;
  admission.reset();
  setChatEnabled(false);
  setRoomConnectionState('ended', message);
  $('#stream-button').disabled = true;
  showToast(message, 'error');
}

function leaveRoom() {
  if (session.isHost) {
    if (!window.confirm('Close this room for everyone?')) return;
    broadcast({ type: 'room-closed' });
    for (const { control } of hostConnections.values()) control.close();
    hostConnections.clear();
  }
  disposeLocalPresentation();
  admission.reset();
  peer?.destroy();
  location.href = appPath();
}

async function copyText(value: string, confirmation: string) {
  try { await navigator.clipboard.writeText(value); }
  catch {
    const input = document.createElement('input');
    input.value = value;
    document.body.append(input);
    input.select();
    document.execCommand('copy');
    input.remove();
  }
  showToast(confirmation);
}

function setShareAudio(enabled: boolean) {
  shareAudioEnabled = enabled;
  document.querySelectorAll<HTMLInputElement>('[data-share-audio]').forEach((input) => { input.checked = enabled; });
}

function setShareAudioControlsDisabled(disabled: boolean) {
  document.querySelectorAll<HTMLInputElement>('[data-share-audio]').forEach((input) => { input.disabled = disabled; });
}

function peerErrorType(error: unknown) {
  return error && typeof error === 'object' && 'type' in error && typeof error.type === 'string' ? error.type : undefined;
}

function errorName(error: unknown) {
  return error instanceof Error ? error.name : undefined;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

$('#share-button').addEventListener('click', startSharing);
$('#stream-button').addEventListener('click', () => localPresentation ? stopLocalPresentation() : startRoomPresentation());
$('#local-audio-button').addEventListener('click', toggleLocalAudio);
$('#leave-room-button').addEventListener('click', leaveRoom);
$('#copy-room-code').addEventListener('click', () => void copyText(session.roomId, 'Room code copied.'));
$('#copy-invite-button').addEventListener('click', () => void copyText(`${location.origin}${appPath(`room/${session.roomId}`)}`, 'Invite link copied.'));

document.querySelectorAll<HTMLInputElement>('[data-share-audio]').forEach((input) => {
  input.addEventListener('change', () => setShareAudio(input.checked));
});

room.querySelector<HTMLFormElement>('[data-chat-form]')?.addEventListener('submit', (event) => {
  event.preventDefault();
  sendChat(event.currentTarget as HTMLFormElement);
});

syncChatSoundButtons();
document.querySelectorAll('[data-chat-sound-toggle]').forEach((button) => button.addEventListener('click', toggleChatSounds));
document.addEventListener('pointerdown', prepareChatAudio, { once: true, passive: true });
document.addEventListener('keydown', prepareChatAudio, { once: true });
setInterval(updateElapsedTimes, 30_000);

document.querySelectorAll<HTMLElement>('[data-quality-trigger]').forEach((button) => {
  button.addEventListener('click', () => toggleQualityMenu(button));
});
document.querySelectorAll<HTMLElement>('[data-quality]').forEach((button) => {
  button.addEventListener('click', () => {
    const quality = button.dataset.quality;
    if (quality && quality in qualityPresets) void setQuality(quality as QualityName);
  });
});
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target?.closest('[data-quality-trigger]') && !target?.closest('#quality-menu')) closeQualityMenu();
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
if (routeMatch) void joinRoom(routeMatch[1].toLowerCase());
else setScreen('landing');
