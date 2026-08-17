import {
  createTextPresentation,
  TEXT_CODEC_ID,
  TextStreamReceiver,
  type TextCodecSettings,
  type TextPresentation,
} from './media/index.js';
import {
  parseHostRoomMessage,
  parseViewerRoomMessage,
  RoomSession,
  type ActivityKind,
  type ChatActivity,
  type ChatEntry,
  type ChatMessage,
  type PresenterInfo,
} from './room/index.js';
import { RtcMesh, type RtcChannel, type RtcPeerChannels } from './rtc/index.js';
import { createRoom, joinRoom as joinSignalingRoom, RestSignalingSession, SignalingError } from './signaling/index.js';

type AppElement = HTMLElement & {
  disabled: boolean;
  select(): void;
  value: string;
};
type ToastTone = 'default' | 'error';
type QualityName = keyof typeof qualityPresets;

interface ViewerEntry {
  control: RtcChannel;
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
const joinPasswordDialog = $<HTMLDialogElement>('#join-password-dialog');
const joinPasswordInput = $<HTMLInputElement>('#join-password');
const joinPasswordError = $('#join-password-error');
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

let mesh: RtcMesh | undefined;
let signaling: RestSignalingSession | undefined;
const session = new RoomSession();
let viewerControl: RtcChannel | undefined;
let localPresentation: TextPresentation | undefined;
let shareAudioEnabled = false;
let maxParticipants = 12;
let guestNumber = 0;
let currentQuality: QualityName = 'balanced';
let currentStreamSettings: TextCodecSettings = { ...qualityPresets.balanced };
let rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: ['stun:main.lohr.dev:3478', 'stun:stun.l.google.com:19302'] }],
};
let chatAudioContext: AudioContext | undefined;
let chatSoundsEnabled = readChatSoundsEnabled();
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let resolvePasswordPrompt: ((password: string | null) => void) | undefined;

const hostConnections = new Map<string, ViewerEntry>();
const presenters = new Map<string, PresenterInfo>();
const peerChannels = new Map<string, RtcPeerChannels>();
const incomingTextReceivers = new Map<string, TextStreamReceiver>();
const remoteAudioElements = new Map<string, HTMLAudioElement>();
const mutedPresenters = new Set<string>();
const chatHistory: ChatEntry[] = [];

const configReady = fetch(appPath('config'))
  .then((response) => response.json())
  .then((config: { iceServers: RTCIceServer[]; maxParticipants: number }) => {
    rtcConfig = { iceServers: config.iceServers };
    maxParticipants = config.maxParticipants;
    const input = document.querySelector<HTMLInputElement>('#room-limit');
    if (input) {
      input.max = String(maxParticipants);
      input.value = String(Math.min(Number(input.value) || maxParticipants, maxParticipants));
    }
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

function normalizeRoomCode(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '');
  return normalized.match(/(?:room\/)?([a-z0-9-]{6,32})\/?$/)?.[1] || '';
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

async function startRoom() {
  const button = $('#share-button');
  button.disabled = true;
  button.classList.add('loading');
  try {
    await configReady;
    signaling = await createRoom(appPath('api'), {
      password: optionalInputValue('#room-password'),
      maxParticipants: selectedRoomLimit(),
    });
    session.startHosting(signaling.roomId, signaling.participantId);
    history.replaceState({}, '', appPath(`room/${session.roomId}`));
    prepareRoomShell();
    setRoomConnectionState('waiting', 'Opening room');

    startNativeMesh(signaling);
    session.markLive();
    setChatEnabled(true);
    setRoomConnectionState('live', 'Host · room open');
    announceSystem('Host', 'joined the room.', 'joined');
    updateRoomUI();
  } catch (error: unknown) {
    disposeLocalPresentation();
    disposeConnections();
    session.reset();
    setScreen('landing');
    history.replaceState({}, '', appPath());
    showToast(errorMessage(error, 'Could not start the room.'), 'error');
  } finally {
    button.disabled = false;
    button.classList.remove('loading');
  }
}

async function joinRoom(id: string, password = '') {
  session.startJoining(id);
  prepareRoomShell();
  setRoomConnectionState('waiting', 'Connecting to host');
  await configReady;
  try {
    signaling = await joinSignalingRoom(appPath('api'), id, { password });
    session.setLocalPeer(signaling.participantId, signaling.hostId);
    startNativeMesh(signaling);
    for (const participant of signaling.participants) mesh?.connect(participant.id);
  } catch (error: unknown) {
    if (error instanceof SignalingError && ['password-required', 'invalid-password'].includes(error.code)) {
      const entered = await requestRoomPassword(id, error.code === 'invalid-password');
      if (entered !== null) return joinRoom(id, entered);
      cancelPendingJoin(id);
      return;
    }
    endViewer(errorMessage(error, 'Could not connect to this room.'));
  }
}

function requestRoomPassword(roomId: string, invalid: boolean) {
  $('#join-password-room').textContent = roomId;
  joinPasswordInput.value = '';
  joinPasswordInput.type = 'password';
  $('#join-password-visibility').setAttribute('aria-pressed', 'false');
  $('#join-password-visibility').setAttribute('aria-label', 'Show password');
  const visibilityLabel = $('#join-password-visibility span');
  visibilityLabel.textContent = 'Show';
  joinPasswordError.textContent = invalid ? 'That password did not work. Try again.' : '';
  joinPasswordError.hidden = !invalid;
  joinPasswordDialog.showModal();
  queueMicrotask(() => joinPasswordInput.focus());
  return new Promise<string | null>((resolve) => { resolvePasswordPrompt = resolve; });
}

function finishPasswordPrompt(password: string | null) {
  const resolve = resolvePasswordPrompt;
  resolvePasswordPrompt = undefined;
  if (joinPasswordDialog.open) joinPasswordDialog.close();
  resolve?.(password);
}

function cancelPendingJoin(roomId: string) {
  disposeConnections();
  session.reset();
  setScreen('landing');
  $('#room-code').value = roomId;
  history.replaceState({}, '', appPath());
}

function prepareRoomShell() {
  $('#room-code-display').textContent = session.roomId;
  $('#room-title').textContent = `Room ${session.roomId}`;
  $('#leave-room-button span').textContent = session.isHost ? 'Close room' : 'Leave room';
  setScreen('room');
  updateParticipantCount(session.isHost ? 1 : 0);
  updateRoomUI();
}

function startNativeMesh(roomSignaling: RestSignalingSession) {
  mesh = new RtcMesh(roomSignaling.participantId, rtcConfig, (signal) => roomSignaling.send(signal), {
    peerAvailable: routePeer,
    peerClosed: handlePeerClosed,
    audioTrack: receiveAudioTrack,
    error: (_, error) => showToast(error.message || 'A peer connection failed.', 'error'),
  });
  roomSignaling.onSignal((signal) => mesh?.handleSignal(signal));
  roomSignaling.onUnavailable(() => {
    if (!session.isHost) endViewer('The room is no longer available.');
    else showToast('The room service connection expired.', 'error');
  });
  roomSignaling.start();
}

function routePeer(peerConnection: RtcPeerChannels) {
  peerChannels.set(peerConnection.peerId, peerConnection);
  if (session.isHost) {
    if (peerConnection.control.open) acceptViewer(peerConnection);
    else peerConnection.control.on('open', () => acceptViewer(peerConnection));
    return;
  }
  if (peerConnection.peerId === session.hostId) {
    viewerControl = peerConnection.control;
    viewerControl.on('message', handleRoomMessage);
    viewerControl.on('close', () => endViewer('The room is no longer available.'));
    setRoomConnectionState('waiting', 'Waiting for host');
  }
  if (localPresentation) connectLocalStreamTo(peerConnection.peerId);
  attachIncomingTextStream(peerConnection.peerId);
}

function acceptViewer(peerConnection: RtcPeerChannels) {
  const viewerId = peerConnection.peerId;
  const connection = peerConnection.control;
  if (hostConnections.has(viewerId)) {
    return;
  }
  guestNumber += 1;
  hostConnections.set(viewerId, { control: connection, name: `Guest ${guestNumber}`, lastMessageAt: 0 });
  const viewer = hostConnections.get(viewerId);
  if (!viewer) return;
  connection.send({ type: 'accepted', name: viewer.name, hostId: session.hostId });
  connection.send({ type: 'chat-history', messages: chatHistory });
  connection.send({ type: 'room-state', presenters: [...presenters.values()] });
  announceSystem(viewer.name, 'joined the room.', 'joined');
  broadcastParticipantCount();
  for (const presenter of presenters.values()) {
    if (presenter.id === session.hostId) connectLocalStreamTo(viewerId);
    else hostConnections.get(presenter.id)?.control.send({ type: 'participant-joined', peerId: viewerId });
  }
  for (const [participantId, participant] of hostConnections) {
    if (participantId !== viewerId && participant.control.open) {
      participant.control.send({ type: 'participant-joined', peerId: viewerId });
    }
  }
  connection.on('message', (value) => handleViewerData(viewerId, value));
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
      session.markLive({ viewerName: message.name, hostId: message.hostId });
      setChatEnabled(true);
      setRoomConnectionState('live', `${session.viewerName} · connected`);
      updateRoomUI();
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
      disconnectLocalStreamFrom(message.peerId);
      if (presenters.has(message.peerId)) removePresenter(message.peerId);
      mesh?.closePeer(message.peerId);
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
    const participants = [signaling?.participantId, ...hostConnections.keys()].filter((id): id is string => Boolean(id && id !== viewerId));
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
  if (localPresentation || session.ended || !signaling?.participantId || !session.beginPresentation()) return;
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
  if (!signaling?.participantId || !mesh) throw new Error('The room connection is not ready.');
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
  await mesh.setAudioTrack(localAudioTracks()[0] ?? null);

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
    id: signaling?.participantId || '',
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
  const channel = mesh?.peer(participantId)?.screen;
  if (!channel || !localPresentation) return;
  localPresentation.connect(participantId, channel);
  updateBandwidthEstimate();
}

function disconnectLocalStreamFrom(participantId: string) {
  localPresentation?.disconnect(participantId);
  updateBandwidthEstimate();
}

function attachIncomingTextStream(presenterId: string) {
  if (presenterId === signaling?.participantId || incomingTextReceivers.has(presenterId) || !presenters.has(presenterId)) return;
  const connection = peerChannels.get(presenterId)?.screen;
  const canvas = streamCardMedia<HTMLCanvasElement>(presenterId, 'canvas');
  if (!connection || !canvas) return;
  const receiver = new TextStreamReceiver(canvas, connection, () => setCardConnected(presenterId));
  incomingTextReceivers.set(presenterId, receiver);
  connection.on('close', () => {
    if (incomingTextReceivers.get(presenterId) === receiver) incomingTextReceivers.delete(presenterId);
  });
}

function receiveAudioTrack(peerId: string, track: MediaStreamTrack, streams: readonly MediaStream[]) {
  if (track.kind !== 'audio' || peerId === signaling?.participantId) return;
  const audio = remoteAudioElements.get(peerId) || document.createElement('audio');
  audio.autoplay = true;
  audio.srcObject = streams[0] ?? new MediaStream([track]);
  audio.muted = mutedPresenters.has(peerId);
  remoteAudioElements.set(peerId, audio);
  const name = presenters.get(peerId)?.name ?? 'participant';
  void audio.play().catch(() => showToast(`Click ${name}’s mute button to enable audio.`));
  track.addEventListener('ended', () => closeIncomingAudio(peerId), { once: true });
}

function closeIncomingAudio(presenterId: string) {
  const audio = remoteAudioElements.get(presenterId);
  if (audio) audio.srcObject = null;
  remoteAudioElements.delete(presenterId);
}

function stopLocalPresentation() {
  if (!localPresentation) return;
  const presenterId = signaling?.participantId;
  disposeLocalPresentation();
  void mesh?.setAudioTrack(null);
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
  attachIncomingTextStream(presenter.id);
  updateStreamGrid();
}

function removePresenter(presenterId: string) {
  presenters.delete(presenterId);
  incomingTextReceivers.get(presenterId)?.close();
  incomingTextReceivers.delete(presenterId);
  closeIncomingAudio(presenterId);
  mutedPresenters.delete(presenterId);
  streamGrid.querySelector(`[data-presenter-id="${CSS.escape(presenterId)}"]`)?.remove();
  updateStreamGrid();
}

function renderStreamCard(presenter: PresenterInfo) {
  let card = streamGrid.querySelector<HTMLElement>(`[data-presenter-id="${CSS.escape(presenter.id)}"]`);
  const isLocal = presenter.id === signaling?.participantId;
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
  if (presenterId === signaling?.participantId) return;
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
  const isLocal = presenterId === signaling?.participantId;
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

function removeViewer(viewerId: string, expectedConnection?: RtcChannel) {
  const viewer = hostConnections.get(viewerId);
  if (!viewer || (expectedConnection && viewer.control !== expectedConnection)) return;
  hostConnections.delete(viewerId);
  peerChannels.delete(viewerId);
  viewer.control.close();
  if (mesh?.peer(viewerId)) mesh.closePeer(viewerId);
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

function handlePeerClosed(peerId: string) {
  peerChannels.delete(peerId);
  incomingTextReceivers.get(peerId)?.close();
  incomingTextReceivers.delete(peerId);
  closeIncomingAudio(peerId);
  if (session.isHost) removeViewer(peerId);
  else if (peerId === session.hostId) endViewer('The room is no longer available.');
  else {
    disconnectLocalStreamFrom(peerId);
    if (presenters.has(peerId)) removePresenter(peerId);
  }
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
  const isOwn = session.isHost ? message.sender === 'host' : message.senderId === signaling?.participantId;
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

function endViewer(message: string) {
  if (!session.end()) return;
  stopLocalPresentation();
  disposeConnections();
  setChatEnabled(false);
  setRoomConnectionState('ended', message);
  $('#stream-button').disabled = true;
  showToast(message, 'error');
}

async function leaveRoom() {
  if (session.isHost) {
    if (!window.confirm('Close this room for everyone?')) return;
    broadcast({ type: 'room-closed' });
    for (const { control } of hostConnections.values()) control.close();
    hostConnections.clear();
    await signaling?.closeRoom().catch(() => {});
  } else {
    await signaling?.leave().catch(() => {});
  }
  disposeLocalPresentation();
  disposeConnections();
  location.href = appPath();
}

function disposeConnections() {
  viewerControl = undefined;
  signaling?.stop();
  signaling = undefined;
  mesh?.close();
  mesh = undefined;
  peerChannels.clear();
  for (const receiver of incomingTextReceivers.values()) receiver.close();
  incomingTextReceivers.clear();
  for (const audio of remoteAudioElements.values()) audio.srcObject = null;
  remoteAudioElements.clear();
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

function errorName(error: unknown) {
  return error instanceof Error ? error.name : undefined;
}

function optionalInputValue(selector: string) {
  return document.querySelector<HTMLInputElement>(selector)?.value ?? '';
}

function selectedRoomLimit() {
  const selected = Number.parseInt(optionalInputValue('#room-limit'), 10);
  return Number.isSafeInteger(selected) ? Math.min(maxParticipants, Math.max(2, selected)) : maxParticipants;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

$('#share-button').addEventListener('click', startRoom);
$('#stream-button').addEventListener('click', () => localPresentation ? stopLocalPresentation() : startRoomPresentation());
$('#local-audio-button').addEventListener('click', toggleLocalAudio);
$('#leave-room-button').addEventListener('click', () => void leaveRoom());
$('#copy-room-code').addEventListener('click', () => void copyText(session.roomId, 'Room code copied.'));
$('#copy-invite-button').addEventListener('click', () => void copyText(`${location.origin}${appPath(`room/${session.roomId}`)}`, 'Invite link copied.'));

document.querySelectorAll<HTMLInputElement>('[data-share-audio]').forEach((input) => {
  input.addEventListener('change', () => setShareAudio(input.checked));
});

document.querySelectorAll<HTMLButtonElement>('[data-room-limit-step]').forEach((button) => {
  button.addEventListener('click', () => {
    const input = document.querySelector<HTMLInputElement>('#room-limit');
    if (!input) return;
    const step = Number(button.dataset.roomLimitStep);
    const current = Number.parseInt(input.value, 10) || 2;
    input.value = String(Math.min(maxParticipants, Math.max(2, current + step)));
  });
});

document.querySelector<HTMLInputElement>('#room-limit')?.addEventListener('change', (event) => {
  (event.currentTarget as HTMLInputElement).value = String(selectedRoomLimit());
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
  history.replaceState({}, '', appPath(`room/${id}`));
  void joinRoom(id);
});

$('#join-password-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const password = joinPasswordInput.value;
  if (!password) {
    joinPasswordError.textContent = 'Enter the room password to continue.';
    joinPasswordError.hidden = false;
    joinPasswordInput.focus();
    return;
  }
  finishPasswordPrompt(password);
});

$('.password-dialog-close').addEventListener('click', () => finishPasswordPrompt(null));
$('.password-cancel').addEventListener('click', () => finishPasswordPrompt(null));
joinPasswordDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  finishPasswordPrompt(null);
});
joinPasswordInput.addEventListener('input', () => { joinPasswordError.hidden = true; });
$('#join-password-visibility').addEventListener('click', () => {
  const button = $('#join-password-visibility');
  const visible = joinPasswordInput.type === 'text';
  joinPasswordInput.type = visible ? 'password' : 'text';
  button.setAttribute('aria-pressed', String(!visible));
  button.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
  $('#join-password-visibility span').textContent = visible ? 'Show' : 'Hide';
  joinPasswordInput.focus();
});

const relativePath = location.pathname.startsWith(appBasePath)
  ? location.pathname.slice(appBasePath.length) || '/'
  : location.pathname;
const routeMatch = relativePath.match(/^\/room\/([a-z0-9-]{6,32})\/?$/i);
if (routeMatch) void joinRoom(routeMatch[1].toLowerCase());
else setScreen('landing');
