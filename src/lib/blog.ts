import { GOOGLE_SHEET_CSV_URL } from '../consts';
import {
	deserializePosts,
	readSessionCache,
	type SerializedBlogPost,
	writeSessionCache,
} from './blog-cache';
import { parseCSV } from './csv';

export type BlogPost = {
	id: string;
	title: string;
	description: string;
	pubDate: Date;
	heroImage?: string;
	contentHtml: string;
};

type SheetRow = {
	'Post date': string;
	Title: string;
	Subtitle: string;
	Image: string;
	Content: string;
};

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/['']/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function contentToHtml(content: string): string {
	if (!content) return '';

	const paragraphs = content
		.split(/\n{2,}/)
		.map((block) => block.trim())
		.filter(Boolean);

	const escape = (text: string) =>
		text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');

	return paragraphs.map((p) => `<p>${escape(p)}</p>`).join('\n');
}

function rowsToPosts(rows: Record<string, string>[]): BlogPost[] {
	const usedSlugs = new Set<string>();
	const posts: BlogPost[] = [];

	for (const row of rows as SheetRow[]) {
		if (!row.Title?.trim()) continue;

		let id = slugify(row.Title);
		if (usedSlugs.has(id)) {
			id = `${id}-${slugify(row['Post date'])}`;
		}
		usedSlugs.add(id);

		posts.push({
			id,
			title: row.Title,
			description: row.Subtitle,
			pubDate: new Date(row['Post date']),
			heroImage: row.Image || undefined,
			contentHtml: contentToHtml(row.Content),
		});
	}

	return posts.sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());
}

let memoryCache: BlogPost[] | null = null;

function getCachedPosts(): BlogPost[] | null {
	if (memoryCache) return memoryCache;
	if (typeof window === 'undefined') return null;

	const fromSession = readSessionCache();
	if (fromSession) {
		memoryCache = fromSession;
		return fromSession;
	}
	return null;
}

function setCachedPosts(posts: BlogPost[]): void {
	memoryCache = posts;
	if (typeof window !== 'undefined') {
		writeSessionCache(posts);
	}
}

/** Seed the client cache from data already fetched on the blog index (SSR). */
export function hydrateBlogCache(serialized: SerializedBlogPost[]): void {
	setCachedPosts(deserializePosts(serialized));
}

async function fetchPostsFromNetwork(): Promise<BlogPost[]> {
	const response = await fetch(GOOGLE_SHEET_CSV_URL);
	if (!response.ok) {
		throw new Error(`Failed to fetch Google Sheet (${response.status} ${response.statusText})`);
	}
	return rowsToPosts(parseCSV(await response.text()));
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
	const cached = getCachedPosts();
	if (cached) return cached;

	const posts = await fetchPostsFromNetwork();
	setCachedPosts(posts);
	return posts;
}

export async function fetchBlogPost(id: string): Promise<BlogPost | undefined> {
	const posts = await fetchBlogPosts();
	return posts.find((post) => post.id === id);
}

export function formatPostDate(date: Date): string {
	return date.toLocaleDateString('en-us', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}
