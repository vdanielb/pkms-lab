import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { GOOGLE_SHEET_CSV_URL } from './consts';
import { googleSheetsLoader } from './loaders/google-sheets';

const blog = defineCollection({
	loader: googleSheetsLoader({ url: GOOGLE_SHEET_CSV_URL }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		heroImage: z.string().url().optional(),
	}),
});

export const collections = { blog };
