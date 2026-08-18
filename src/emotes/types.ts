export type EmoteProvider = 'twitch' | 'bttv' | 'ffz' | '7tv';

export interface ChatEmote {
  name: string;
  url: string;
  provider: EmoteProvider;
  animated: boolean;
}

export interface EmoteAsset {
  contentType: string;
  data: Uint8Array;
}

export interface EmoteService {
  catalog(assetBasePath: string): Promise<ChatEmote[]>;
  asset(id: string): Promise<EmoteAsset | undefined>;
}
