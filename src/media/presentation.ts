import type { MediaConnection, Peer as PeerInstance } from 'peerjs';
import { LosslessTextEncoder, type TextCodecSettings } from './text-lossless.js';
import { TextStreamBroadcaster } from './text-transport.js';

export interface TextPresentation {
  readonly stream: MediaStream;
  readonly videoTrack: MediaStreamTrack | undefined;
  start(): Promise<void>;
  updateSettings(settings: TextCodecSettings): void;
  connect(peer: PeerInstance, participantId: string, presenter: object, mediaToken: string): void;
  disconnect(participantId: string): void;
  hasConnection(participantId: string): boolean;
  audioTracks(): MediaStreamTrack[];
  setAudioEnabled(enabled: boolean): void;
  stop(): void;
}

export function createTextPresentation(stream: MediaStream, settings: TextCodecSettings): TextPresentation {
  return new BrowserTextPresentation(stream, settings);
}

class BrowserTextPresentation implements TextPresentation {
  private readonly broadcaster: TextStreamBroadcaster;
  private readonly encoder: LosslessTextEncoder;
  private readonly outgoingAudioCalls = new Map<string, MediaConnection>();
  private stopped = false;

  constructor(readonly stream: MediaStream, settings: TextCodecSettings) {
    this.broadcaster = new TextStreamBroadcaster(() => this.encoder.requestKeyframe());
    this.encoder = new LosslessTextEncoder(stream, settings, (frame) => this.broadcaster.send(frame));
  }

  get videoTrack() {
    return this.stream.getVideoTracks()[0];
  }

  async start() {
    if (this.stopped) throw new Error('Cannot start a stopped presentation.');
    await this.encoder.start();
  }

  updateSettings(settings: TextCodecSettings) {
    if (!this.stopped) this.encoder.updateSettings(settings);
  }

  connect(peer: PeerInstance, participantId: string, presenter: object, mediaToken: string) {
    if (this.stopped || !mediaToken || participantId === peer.id || this.broadcaster.has(participantId)) return;
    const textConnection = peer.connect(participantId, {
      label: `text-${peer.id}`,
      metadata: { role: 'text-stream', presenter, mediaToken },
      serialization: 'binary',
      reliable: true,
    });
    this.broadcaster.add(textConnection);
    textConnection.on('open', () => this.encoder.requestKeyframe());

    const audioTracks = this.audioTracks();
    if (!audioTracks.length) return;
    const call = peer.call(participantId, new MediaStream(audioTracks), {
      metadata: { role: 'presenter-audio', presenter, mediaToken },
    });
    this.outgoingAudioCalls.get(participantId)?.close();
    this.outgoingAudioCalls.set(participantId, call);
    const remove = () => {
      if (this.outgoingAudioCalls.get(participantId) === call) this.outgoingAudioCalls.delete(participantId);
    };
    call.on('close', remove);
    call.on('error', remove);
  }

  disconnect(participantId: string) {
    this.broadcaster.remove(participantId);
    const call = this.outgoingAudioCalls.get(participantId);
    this.outgoingAudioCalls.delete(participantId);
    call?.close();
  }

  hasConnection(participantId: string) {
    return this.broadcaster.has(participantId);
  }

  audioTracks() {
    return this.stream.getAudioTracks().filter((track) => track.readyState === 'live');
  }

  setAudioEnabled(enabled: boolean) {
    for (const track of this.audioTracks()) track.enabled = enabled;
  }

  stop() {
    if (this.stopped) return;
    this.stopped = true;
    this.encoder.stop();
    this.broadcaster.close();
    for (const call of this.outgoingAudioCalls.values()) call.close();
    this.outgoingAudioCalls.clear();
    for (const track of this.stream.getTracks()) {
      track.onended = null;
      track.stop();
    }
  }
}
