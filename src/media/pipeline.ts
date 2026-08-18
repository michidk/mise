/** Metadata shared with the room. Codec-specific settings extend this shape. */
export interface StreamSettings {
  codec: string;
  frameRate: number;
  label: string;
  buttonLabel: string;
}

export const NATIVE_VIDEO_CODEC_ID = 'webrtc-video-v1' as const;

export type VideoCompression = 'high' | 'balanced' | 'low';

/** Settings implemented by the browser's native WebRTC video encoder. */
export interface NativeVideoSettings extends StreamSettings {
  codec: typeof NATIVE_VIDEO_CODEC_ID;
  width: number;
  height: number;
  bitrate: number;
  compression: VideoCompression;
}

/** Capture/encode lifecycle consumed by the room, independent of the codec. */
export interface MediaEncoder<Settings extends StreamSettings> {
  start(): Promise<void>;
  updateSettings(settings: Settings): void;
  requestKeyframe(): void;
  stop(): void;
}

/** Decode/render lifecycle. A future video codec can render to a different sink. */
export interface MediaRenderer<Frame> {
  render(frame: Frame): Promise<void>;
}
