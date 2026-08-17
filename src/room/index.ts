export { parseHostRoomMessage, parsePresenter, parseTextSettings, parseViewerRoomMessage } from './internal/protocol.js';
export { RoomAdmission } from './internal/admission.js';
export { RoomSession } from './internal/session.js';
export type {
  ActivityKind,
  ChatActivity,
  ChatEntry,
  ChatMessage,
  HostRoomMessage,
  MediaCredential,
  PresenterInfo,
  RoomConnectionState,
  RoomRole,
  RoomSessionSnapshot,
  ViewerRoomMessage,
} from './types.js';
