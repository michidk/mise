import type { ChatEmoteRenderer } from '../types.js';

interface ChatEmote {
  name: string;
  url: string;
  provider: 'twitch' | 'bttv' | 'ffz' | '7tv';
  animated: boolean;
}

export function buildChatEmoteRenderer(endpoint: string): ChatEmoteRenderer {
  const emotes = new Map<string, ChatEmote>();
  return {
    async load() {
      const response = await fetch(endpoint, { headers: { accept: 'application/json' } });
      if (!response.ok) return;
      const result = await response.json() as { emotes?: unknown };
      if (!Array.isArray(result.emotes)) return;
      for (const candidate of result.emotes) {
        const emote = parseChatEmote(candidate);
        if (emote) emotes.set(emote.name, emote);
      }
    },
    render(container, text) {
      const content = document.createDocumentFragment();
      for (const token of text.split(/(\s+)/)) {
        const emote = emotes.get(token);
        if (!emote) {
          content.append(document.createTextNode(token));
          continue;
        }
        const image = document.createElement('img');
        image.className = 'chat-emote';
        image.src = emote.url;
        image.alt = emote.name;
        image.title = `${emote.name} · ${emote.provider.toUpperCase()}`;
        image.loading = 'lazy';
        image.decoding = 'async';
        image.referrerPolicy = 'no-referrer';
        content.append(image);
      }
      container.replaceChildren(content);
    },
  };
}

function parseChatEmote(value: unknown): ChatEmote | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as Partial<ChatEmote>;
  if (typeof candidate.name !== 'string' || !candidate.name || candidate.name.length > 100
    || typeof candidate.url !== 'string' || !/^\/(?!\/)/.test(candidate.url)
    || !['twitch', 'bttv', 'ffz', '7tv'].includes(candidate.provider ?? '')) return undefined;
  return {
    name: candidate.name,
    url: candidate.url,
    provider: candidate.provider as ChatEmote['provider'],
    animated: candidate.animated === true,
  };
}
