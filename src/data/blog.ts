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

export interface BlogTagSummary {
	name: string;
	count: number;
}

export interface BlogDataset {
	posts: BlogPostEntry[];
	recentPosts: BlogPostEntry[];
	searchEntries: BlogSearchEntry[];
	categorySummaries: BlogCategorySummary[];
	tagSummaries: BlogTagSummary[];
}

type BlogDatasetBase = Omit<BlogDataset, 'recentPosts'>;

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
