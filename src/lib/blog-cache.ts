export const BLOG_CACHE_KEY = 'pkms-blog-posts';

export type SerializedBlogPost = {
	id: string;
	title: string;
	description: string;
	pubDate: string;
	heroImage?: string;
	contentHtml: string;
};

type BlogPostLike = Omit<SerializedBlogPost, 'pubDate'> & { pubDate: Date };

export function serializePosts(posts: BlogPostLike[]): SerializedBlogPost[] {
	return posts.map(({ pubDate, ...post }) => ({
		...post,
		pubDate: pubDate.toISOString(),
	}));
}

export function deserializePosts(posts: SerializedBlogPost[]): BlogPostLike[] {
	return posts.map((post) => ({ ...post, pubDate: new Date(post.pubDate) }));
}

export function readSessionCache() {
	try {
		const raw = sessionStorage.getItem(BLOG_CACHE_KEY);
		if (!raw) return null;
		return deserializePosts(JSON.parse(raw));
	} catch {
		return null;
	}
}

export function writeSessionCache(posts: BlogPostLike[]): void {
	try {
		sessionStorage.setItem(BLOG_CACHE_KEY, JSON.stringify(serializePosts(posts)));
	} catch {
		// Quota exceeded or private browsing — memory cache still applies this session.
	}
}

export function prefetchBlogRoutes(ids: string[]): void {
	const prefetch = () => {
		for (const id of ids) {
			const link = document.createElement('link');
			link.rel = 'prefetch';
			link.href = `/blog/${id}/`;
			document.head.append(link);
		}
	};

	if ('requestIdleCallback' in window) {
		requestIdleCallback(prefetch);
	} else {
		setTimeout(prefetch, 200);
	}
}
