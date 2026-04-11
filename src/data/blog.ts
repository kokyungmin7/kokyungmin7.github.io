import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPostEntry = CollectionEntry<'blog'>;

export interface BlogSearchEntry {
	id: string;
	title: string;
	description: string;
	category: string;
}

export interface BlogCategorySummary {
	name: string;
	count: number;
}

export interface BlogCategoryTree {
	name: string;
	count: number;
	subcategories: { name: string; count: number }[];
}

export interface BlogTagSummary {
	name: string;
	count: number;
}

export interface BlogDataset {
	posts: BlogPostEntry[];
	recentPosts: BlogPostEntry[];
	searchEntries: BlogSearchEntry[];
	categorySummaries: BlogCategorySummary[];
	categoryTree: BlogCategoryTree[];
	tagSummaries: BlogTagSummary[];
}

type BlogDatasetBase = Omit<BlogDataset, 'recentPosts'>;

export function toSlug(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const PREDEFINED_CATEGORIES: { name: string; subcategories: string[] }[] = [
	{ name: 'AI', subcategories: ['Computer Vision', 'Language Models', 'Machine Learning'] },
	{ name: 'Math', subcategories: ['Linear Algebra', 'Probability & Statistics'] },
	{ name: 'Engineering', subcategories: ['Optimization', 'System Design'] },
];

function buildCategoryTree(posts: BlogPostEntry[]): BlogCategoryTree[] {
	return PREDEFINED_CATEGORIES.map(({ name, subcategories }) => {
		const parentPosts = posts.filter((p) => p.data.category === name);
		return {
			name,
			count: parentPosts.length,
			subcategories: subcategories
				.map((sub) => ({
					name: sub,
					count: parentPosts.filter((p) => p.data.subcategory === sub).length,
				}))
				.filter((sub) => sub.count > 0),
		};
	});
}

function sortBlogPosts(posts: BlogPostEntry[]): BlogPostEntry[] {
	return [...posts].sort(
		(firstPost, secondPost) =>
			secondPost.data.pubDate.valueOf() - firstPost.data.pubDate.valueOf(),
	);
}

let cachedBlogDatasetBase: BlogDatasetBase | undefined;

export async function getBlogDataset(recentPostLimit = 5): Promise<BlogDataset> {
	if (!cachedBlogDatasetBase) {
		const posts = sortBlogPosts(await getCollection('blog'));
		const searchEntries = posts.map((post) => ({
			id: post.id,
			title: post.data.title,
			description: post.data.description,
			category: post.data.category ?? '',
		}));
		const categoryCounts = new Map<string, number>();
		const tagCounts = new Map<string, number>();

		for (const post of posts) {
			const categoryName = post.data.category ?? '일반';
			categoryCounts.set(categoryName, (categoryCounts.get(categoryName) ?? 0) + 1);

			for (const tagName of post.data.tags) {
				tagCounts.set(tagName, (tagCounts.get(tagName) ?? 0) + 1);
			}
		}

		cachedBlogDatasetBase = {
			posts,
			searchEntries,
			categorySummaries: [
				{ name: '전체', count: posts.length },
				...Array.from(categoryCounts.entries()).map(([name, count]) => ({ name, count })),
			],
			categoryTree: buildCategoryTree(posts),
			tagSummaries: Array.from(tagCounts.entries())
				.sort((firstTag, secondTag) => secondTag[1] - firstTag[1])
				.map(([name, count]) => ({ name, count })),
		};
	}

	const datasetBase = cachedBlogDatasetBase;

	return {
		...datasetBase,
		recentPosts: datasetBase.posts.slice(0, recentPostLimit),
	};
}

export async function getSortedBlogPosts(): Promise<BlogPostEntry[]> {
	return (await getBlogDataset()).posts;
}

export async function getRecentBlogPosts(limit = 5): Promise<BlogPostEntry[]> {
	const { posts } = await getBlogDataset();
	return posts.slice(0, limit);
}

export async function getBlogSearchEntries(): Promise<BlogSearchEntry[]> {
	return (await getBlogDataset()).searchEntries;
}

export async function getBlogCategorySummaries(): Promise<BlogCategorySummary[]> {
	return (await getBlogDataset()).categorySummaries;
}

export async function getBlogTagSummaries(): Promise<BlogTagSummary[]> {
	return (await getBlogDataset()).tagSummaries;
}
