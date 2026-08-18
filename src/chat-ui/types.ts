export type RoomNotificationKind = 'joined' | 'left' | 'message';

export interface ChatEmoteRenderer {
  load(): Promise<void>;
  render(container: HTMLElement, text: string): void;
}

export interface RoomNotificationController {
  readonly enabled: boolean;
  show(input: { kind: RoomNotificationKind; title: string; description: string }): void;
  toggle(): boolean;
  syncButtons(selector?: string): void;
}
