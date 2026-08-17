import TwitchEmoticons, { type Emote } from '@mkody/twitch-emoticons';

const { EmoteFetcher } = TwitchEmoticons;

export type EmoteProvider = 'twitch' | 'bttv' | 'ffz' | '7tv';

export interface ChatEmote {
  name: string;
  url: string;
  provider: EmoteProvider;
  animated: boolean;
}

interface RenderableEmote extends Emote {
  type: EmoteProvider;
  animated?: boolean;
  modifier?: boolean;
  toLink(size?: number): string;
}

interface CachedCatalog {
  emotes: ChatEmote[];
  expiresAt: number;
}

const CACHE_LIFETIME_MS = 6 * 60 * 60 * 1_000;
let cache: CachedCatalog | undefined;
let loading: Promise<ChatEmote[]> | undefined;

export function globalEmotes() {
  if (cache && cache.expiresAt > Date.now()) return Promise.resolve(cache.emotes);
  if (loading) return loading;
  loading = loadGlobalEmotes().then((emotes) => {
    cache = { emotes, expiresAt: Date.now() + CACHE_LIFETIME_MS };
    return emotes;
  }).finally(() => { loading = undefined; });
  return loading;
}

async function loadGlobalEmotes(): Promise<ChatEmote[]> {
  const twitchClientId = process.env.TWITCH_CLIENT_ID;
  const twitchClientSecret = process.env.TWITCH_CLIENT_SECRET;
  const fetcher = new EmoteFetcher(twitchClientId, twitchClientSecret);
  const providers: Array<{
    name: EmoteProvider;
    load: () => Promise<Map<string, RenderableEmote>>;
  }> = [
    { name: 'bttv', load: () => fetcher.fetchBTTVEmotes() as Promise<Map<string, RenderableEmote>> },
    { name: 'ffz', load: () => fetcher.fetchFFZEmotes() as Promise<Map<string, RenderableEmote>> },
    { name: '7tv', load: () => fetcher.fetchSevenTVEmotes() as Promise<Map<string, RenderableEmote>> },
  ];
  if (twitchClientId && twitchClientSecret) {
    providers.push({ name: 'twitch', load: () => fetcher.fetchTwitchEmotes() as Promise<Map<string, RenderableEmote>> });
  }

  const results = await Promise.allSettled(providers.map(({ load }) => load()));
  const catalog = new Map<string, ChatEmote>();
  results.forEach((result, index) => {
    const provider = providers[index];
    if (result.status === 'rejected') {
      console.warn(`Could not load ${provider.name} emotes:`, errorMessage(result.reason));
      return;
    }
    for (const emote of result.value.values()) {
      if (emote.modifier || !emote.code) continue;
      const url = emote.toLink(1);
      if (!isHttpsUrl(url)) continue;
      catalog.set(emote.code, {
        name: emote.code,
        url,
        provider: emote.type,
        animated: emote.animated === true,
      });
    }
  });
  return [...catalog.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
