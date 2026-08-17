import type { RtcChannel } from '../rtc/index.js';
import { LosslessTextEncoder, type TextCodecSettings } from './text-lossless.js';
import { TextStreamBroadcaster } from './text-transport.js';

export interface TextPresentation {
  readonly stream: MediaStream;
  readonly videoTrack: MediaStreamTrack | undefined;
  start(): Promise<void>;
  updateSettings(settings: TextCodecSettings): void;
  connect(participantId: string, channel: RtcChannel): void;
  disconnect(participantId: string): void;
  hasConnection(participantId: string): boolean;
  audioTracks(): MediaStreamTrack[];
  setAudioEnabled(enabled: boolean): void;
  stop(stopTracks?: boolean): void;
}

export function createTextPresentation(stream: MediaStream, settings: TextCodecSettings): TextPresentation {
  return new BrowserTextPresentation(stream, settings);
}

class BrowserTextPresentation implements TextPresentation {
  private readonly broadcaster: TextStreamBroadcaster;
  private readonly encoder: LosslessTextEncoder;
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

  connect(participantId: string, channel: RtcChannel) {
    if (this.stopped || this.broadcaster.has(participantId)) return;
    this.broadcaster.add(channel);
    if (channel.open) this.encoder.requestKeyframe();
  }

  disconnect(participantId: string) {
    this.broadcaster.remove(participantId, false);
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

  stop(stopTracks = true) {
    if (this.stopped) return;
    this.stopped = true;
    this.encoder.stop();
    this.broadcaster.close(false);
    if (stopTracks) for (const track of this.stream.getTracks()) {
      track.onended = null;
      track.stop();
    }
  }
}
