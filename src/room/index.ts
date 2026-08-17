export { parseHostRoomMessage, parsePresenter, parseStreamSettings, parseTextSettings, parseViewerRoomMessage } from './internal/protocol.js';
export { RoomSession } from './internal/session.js';
export { guestIdentity, type GuestIdentity } from './internal/guest-identity.js';
export type {
  ActivityKind,
  ChatActivity,
  ChatEntry,
  ChatMessage,
  HostRoomMessage,
  PresenterInfo,
  RoomStreamSettings,
  RoomConnectionState,
  RoomRole,
  RoomSessionSnapshot,
  ViewerRoomMessage,
} from './types.js';
