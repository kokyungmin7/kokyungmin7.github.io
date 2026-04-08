import { getCollection, type CollectionEntry } from 'astro:content';

export type ProjectEntry = CollectionEntry<'projects'>;
export type ProjectStatus = ProjectEntry['data']['status'];

export interface ProjectDataset {
	projects: ProjectEntry[];
}

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
	active: '진행 중',
	wip: '개발 중',
	archived: '완료',
};

export const PROJECT_STATUS_CLASS: Record<ProjectStatus, string> = {
	active: 'status-active',
	wip: 'status-wip',
	archived: 'status-archived',
};

let cachedProjectDataset: ProjectDataset | undefined;

export async function getProjectDataset(): Promise<ProjectDataset> {
	if (!cachedProjectDataset) {
		const projects = (await getCollection('projects')).sort(
			(firstProject, secondProject) =>
				secondProject.data.startDate.valueOf() - firstProject.data.startDate.valueOf(),
		);

		cachedProjectDataset = { projects };
	}

	return cachedProjectDataset;
}
