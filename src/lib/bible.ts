export type Verse = { chapter: number; verse: number; text: string };
export type Passage = { reference: string; translation: string; verses: Verse[] };

const API = 'https://bible-api.com';
const memory = new Map<string, Promise<Passage>>();

export function fetchPassage(ref: string, translation = 'web'): Promise<Passage> {
    const key = `bible:${translation}:${ref}`;
    const hit = memory.get(key);
    if (hit) return hit;

    const stored = localStorage.getItem(key);
    if (stored) {
        const p = Promise.resolve(JSON.parse(stored) as Passage);
        memory.set(key, p);
        return p;
    }

    // bible-api.com format: /john+3:16?translation=web
    const url = `${API}/${encodeURI(ref.trim().replace(/\s+/g, '+'))}?translation=${translation}`;
    const p = fetch(url).then(async (res) => {
        if (res.status === 429) throw new Error('Too many requests. Wait a few seconds and try again.');
        if (!res.ok) throw new Error(`Could not load passage (HTTP ${res.status}).`);
        const json = (await res.json()) as {
            reference: string;
            translation_name: string;
            verses: { chapter: number; verse: number; text: string }[];
        };
        const passage: Passage = {
            reference: json.reference,
            translation: json.translation_name,
            verses: json.verses.map(({ chapter, verse, text }) => ({ chapter, verse, text: text.trim() })),
        };
        try {
            localStorage.setItem(key, JSON.stringify(passage));
        } catch {
            /* storage full: ignore */
        }
        return passage;
    });

    memory.set(key, p);
    p.catch(() => memory.delete(key)); // allow retry after errors
    return p;
}

export const gatewayUrl = (ref: string, version = 'WEB') =>
    `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=${version}`;