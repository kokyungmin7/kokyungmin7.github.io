export type SiteNavIcon = 'home' | 'blog' | 'projects' | 'about';

export interface SiteNavItem {
	href: string;
	label: string;
	sidebarLabel: string;
	icon: SiteNavIcon;
	match: 'exact' | 'section';
}

export const SITE_NAV_ITEMS: SiteNavItem[] = [
	{
		href: '/',
		label: 'Home',
		sidebarLabel: 'HOME',
		icon: 'home',
		match: 'exact',
	},
	{
		href: '/blog',
		label: 'Blog',
		sidebarLabel: 'BLOG',
		icon: 'blog',
		match: 'section',
	},
	{
		href: '/projects',
		label: 'Projects',
		sidebarLabel: 'PROJECTS',
		icon: 'projects',
		match: 'section',
	},
	{
		href: '/about',
		label: 'About',
		sidebarLabel: 'ABOUT',
		icon: 'about',
		match: 'section',
	},
];

export function isActivePath(pathname: string, item: SiteNavItem): boolean {
	if (item.match === 'exact') return pathname === item.href;

	return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
