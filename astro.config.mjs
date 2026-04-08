// @ts-check

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'


// https://astro.build/config
export default defineConfig({
	site: 'https://kokyungmin7.github.io',
	integrations: [
		mdx({
			remarkPlugins: [remarkMath],
			rehypePlugins: [rehypeKatex],
		}),
		sitemap(),
		react(),
	],
        markdown: {
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
        }
});
