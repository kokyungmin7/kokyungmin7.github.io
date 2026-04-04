import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			category: z.string().optional(),
		}),
});

const projects = defineCollection({
	loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			category: z.string().optional(),
			status: z.enum(['active', 'wip', 'archived']).default('active'),
			startDate: z.coerce.date(),
			techStack: z.array(z.string()).default([]),
			links: z
				.object({
					github: z.string().optional(),
					demo: z.string().optional(),
				})
				.optional(),
			metrics: z
				.array(z.object({ label: z.string(), value: z.string() }))
				.optional(),
			highlights: z.array(z.string()).optional(),
			image: z.optional(image()),
		}),
});

export const collections = { blog, projects };
