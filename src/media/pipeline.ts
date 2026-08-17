/** Metadata shared with the room. Codec-specific settings extend this shape. */
export interface StreamSettings {
  codec: string;
  frameRate: number;
  label: string;
  buttonLabel: string;
}

/** Capture/encode lifecycle consumed by the room, independent of the codec. */
export interface MediaEncoder<Settings extends StreamSettings, Frame> {
  start(): Promise<void>;
  updateSettings(settings: Settings): void;
  requestKeyframe(): void;
  stop(): void;
}

/** Decode/render lifecycle. A future video codec can render to a different sink. */
export interface MediaRenderer<Frame> {
  render(frame: Frame): Promise<void>;
}
