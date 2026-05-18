import type { Loader } from 'astro/loaders';
import { parseCSV } from '../lib/csv';

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/['']/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export type SheetRow = {
	'Post date': string;
	Title: string;
	Subtitle: string;
	Image: string;
	Content: string;
};

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

export function googleSheetsLoader(options: { url: string }): Loader {
	const usedSlugs = new Set<string>();

	return {
		name: 'google-sheets-loader',
		load: async ({ store, parseData, logger }) => {
			logger.info('Fetching blog posts from Google Sheets');
			const response = await fetch(options.url);

			if (!response.ok) {
				throw new Error(`Failed to fetch Google Sheet (${response.status} ${response.statusText})`);
			}

			const rows = parseCSV(await response.text()) as SheetRow[];
			store.clear();
			usedSlugs.clear();

			for (const row of rows) {
				if (!row.Title?.trim()) continue;

				let id = slugify(row.Title);
				if (usedSlugs.has(id)) {
					id = `${id}-${slugify(row['Post date'])}`;
				}
				usedSlugs.add(id);
				const data = await parseData({
					id,
					data: {
						title: row.Title,
						description: row.Subtitle,
						pubDate: row['Post date'],
						heroImage: row.Image || undefined,
					},
				});

				store.set({
					id,
					data,
					rendered: {
						html: contentToHtml(row.Content),
					},
				});
			}

			logger.info(`Loaded ${rows.filter((r) => r.Title?.trim()).length} blog posts`);
		},
	};
}
