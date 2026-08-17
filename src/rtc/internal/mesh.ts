import type { OutgoingSignal, SignalEnvelope } from '../../signaling/index.js';
import { NativeRtcChannel } from './channel.js';
import type { RtcMeshEvents, RtcPeerChannels } from '../types.js';

interface PeerState extends RtcPeerChannels {
  connection: RTCPeerConnection;
  audioSender: RTCRtpSender;
  makingOffer: boolean;
  ignoreOffer: boolean;
  settingRemoteAnswer: boolean;
  pendingCandidates: RTCIceCandidateInit[];
}

export class RtcMesh {
  private readonly peers = new Map<string, PeerState>();
  private audioTrack: MediaStreamTrack | null = null;
  private closed = false;

  constructor(
    private readonly localPeerId: string,
    private readonly configuration: RTCConfiguration,
    private readonly sendSignal: (signal: OutgoingSignal) => Promise<void>,
    private readonly events: Partial<RtcMeshEvents> = {},
  ) {}

  connect(peerId: string) {
    const peer = this.ensurePeer(peerId);
    void this.negotiate(peer);
    return peer;
  }

  peer(peerId: string) {
    return this.peers.get(peerId);
  }

  async handleSignal(signal: SignalEnvelope) {
    if (this.closed || signal.recipientId !== this.localPeerId || signal.senderId === this.localPeerId) return;
    const peer = this.ensurePeer(signal.senderId);
    try {
      if (signal.kind === 'description') {
        const description = signal.payload as RTCSessionDescriptionInit;
        if (!description || !['offer', 'answer'].includes(description.type)) return;
        const readyForOffer = !peer.makingOffer
          && (peer.connection.signalingState === 'stable' || peer.settingRemoteAnswer);
        const offerCollision = description.type === 'offer' && !readyForOffer;
        const polite = this.localPeerId.localeCompare(peer.peerId) > 0;
        peer.ignoreOffer = !polite && offerCollision;
        if (peer.ignoreOffer) return;
        peer.settingRemoteAnswer = description.type === 'answer';
        await peer.connection.setRemoteDescription(description);
        peer.settingRemoteAnswer = false;
        if (description.type === 'offer') {
          await peer.connection.setLocalDescription();
          await this.send(peer.peerId, 'description', peer.connection.localDescription?.toJSON());
        }
        for (const candidate of peer.pendingCandidates.splice(0)) {
          try {
            await peer.connection.addIceCandidate(candidate);
          } catch (error) {
            if (!peer.ignoreOffer) this.events.error?.(peer.peerId, asError(error));
          }
        }
        return;
      }
      const candidate = signal.payload as RTCIceCandidateInit;
      if (!candidate || typeof candidate.candidate !== 'string') return;
      if (!peer.connection.remoteDescription) {
        peer.pendingCandidates.push(candidate);
        return;
      }
      try {
        await peer.connection.addIceCandidate(candidate);
      } catch (error) {
        if (!peer.ignoreOffer) throw error;
      }
    } catch (error) {
      this.events.error?.(peer.peerId, asError(error));
    }
  }

  async setAudioTrack(track: MediaStreamTrack | null) {
    this.audioTrack = track;
    await Promise.all([...this.peers.values()].map((peer) => peer.audioSender.replaceTrack(track)));
  }

  closePeer(peerId: string) {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    this.peers.delete(peerId);
    peer.control.close();
    peer.screen.close();
    peer.connection.close();
    this.events.peerClosed?.(peerId);
  }

  close() {
    this.closed = true;
    for (const peerId of [...this.peers.keys()]) this.closePeer(peerId);
  }

  private ensurePeer(peerId: string) {
    const existing = this.peers.get(peerId);
    if (existing) return existing;
    if (this.closed || !validPeerId(peerId) || peerId === this.localPeerId) throw new Error('Cannot create an invalid peer connection.');
    const connection = new RTCPeerConnection(this.configuration);
    const control = new NativeRtcChannel(peerId, connection.createDataChannel('control', { negotiated: true, id: 0, ordered: true }));
    const screen = new NativeRtcChannel(peerId, connection.createDataChannel('screen', { negotiated: true, id: 1, ordered: true }));
    const audioSender = connection.addTransceiver('audio', { direction: 'sendrecv' }).sender;
    const peer: PeerState = {
      peerId,
      connection,
      control,
      screen,
      audioSender,
      makingOffer: false,
      ignoreOffer: false,
      settingRemoteAnswer: false,
      pendingCandidates: [],
    };
    this.peers.set(peerId, peer);
    this.events.peerAvailable?.(peer);
    connection.addEventListener('icecandidate', (event) => {
      if (event.candidate) void this.send(peerId, 'candidate', event.candidate.toJSON());
    });
    connection.addEventListener('negotiationneeded', () => void this.negotiate(peer));
    connection.addEventListener('track', (event) => this.events.audioTrack?.(peerId, event.track, event.streams));
    connection.addEventListener('connectionstatechange', () => {
      if (['failed', 'closed'].includes(connection.connectionState)) this.closePeer(peerId);
    });
    if (this.audioTrack) void audioSender.replaceTrack(this.audioTrack);
    return peer;
  }

  private async negotiate(peer: PeerState) {
    if (this.closed || peer.makingOffer || peer.connection.signalingState !== 'stable') return;
    try {
      peer.makingOffer = true;
      await peer.connection.setLocalDescription();
      await this.send(peer.peerId, 'description', peer.connection.localDescription?.toJSON());
    } catch (error) {
      this.events.error?.(peer.peerId, asError(error));
    } finally {
      peer.makingOffer = false;
    }
  }

  private async send(recipientId: string, kind: OutgoingSignal['kind'], payload: unknown) {
    if (payload !== undefined) await this.sendSignal({ recipientId, kind, payload });
  }
}

function validPeerId(value: string) {
  return /^[A-Za-z0-9_-]{8,40}$/.test(value);
}

function asError(value: unknown) {
  return value instanceof Error ? value : new Error(String(value));
}
