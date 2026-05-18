import rss from '@astrojs/rss';
import { fetchBlogPosts } from '../lib/blog';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export const prerender = false;

export async function GET(context) {
	try {
		const posts = await fetchBlogPosts();

		return rss({
			title: SITE_TITLE,
			description: SITE_DESCRIPTION,
			site: context.site,
			items: posts.map((post) => ({
				title: post.title,
				description: post.description,
				pubDate: post.pubDate,
				link: `/blog/${post.id}/`,
			})),
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to load blog posts';
		return new Response(message, { status: 500 });
	}
}
