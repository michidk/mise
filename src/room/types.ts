import type { TextCodecSettings } from '../media/index.js';

export type ActivityKind = 'joined' | 'left' | 'stream-started' | 'stream-stopped' | 'audio' | 'settings';

export interface PresenterInfo {
  id: string;
  name: string;
  isHost: boolean;
  audioEnabled: boolean;
  settings: TextCodecSettings;
}

export interface ChatMessage {
  type: 'chat';
  id: string;
  sender: 'host' | 'viewer';
  senderId: string;
  author: string;
  text: string;
  sentAt: number;
}

export interface ChatActivity {
  type: 'chat-activity';
  id: string;
  activity: ActivityKind;
  author: string;
  text: string;
  occurredAt: number;
}

export type ChatEntry = ChatMessage | ChatActivity;

export interface MediaCredential {
  peerId: string;
  mediaToken: string;
}

export type HostRoomMessage =
  | { type: 'room-full' }
  | { type: 'room-closed' }
  | { type: 'accepted'; name: string; hostId: string; mediaToken: string; participants: MediaCredential[] }
  | { type: 'participant-authorized'; participant: MediaCredential }
  | { type: 'chat-history'; messages: ChatEntry[] }
  | ChatEntry
  | { type: 'participant-count'; participantCount: number }
  | { type: 'room-state'; presenters: PresenterInfo[] }
  | { type: 'stream-started' | 'stream-settings' | 'stream-audio'; presenter: PresenterInfo }
  | { type: 'stream-stopped'; presenterId: string }
  | { type: 'share-approved'; participants: string[] }
  | { type: 'participant-joined' | 'participant-left'; peerId: string };

export type ViewerRoomMessage =
  | { type: 'stream-started'; streamSettings?: TextCodecSettings; audioEnabled: boolean }
  | { type: 'stop-presenting' }
  | { type: 'settings-changed' | 'settings-selected'; streamSettings: TextCodecSettings }
  | { type: 'audio-changed'; audioEnabled: boolean }
  | { type: 'chat'; text: string };

export type RoomRole = 'none' | 'host' | 'viewer';
export type RoomConnectionState = 'idle' | 'connecting' | 'live' | 'ended';

export interface RoomSessionSnapshot {
  role: RoomRole;
  connection: RoomConnectionState;
  roomId: string;
  hostId: string;
  viewerName: string;
  presentationPending: boolean;
  participantCount: number;
}
