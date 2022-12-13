import { join } from 'path';
import { getGlob } from './globs.js';

let cachedPaths;
let cachedLanguages;
let cachedLayouts;

export function normalisePath(path) {
	return path
		?.replace(/^\/+/, '')
		?.replace(/\/+$/, '')
		?.replace(/\/+/, '/');
}

export function getPaths(hugoConfig = {}) {
	if (cachedPaths) {
		return cachedPaths;
	}

	const staticDir = normalisePath(hugoConfig.staticDir) || 'static';
	const contentDir = normalisePath(hugoConfig.contentDir) || 'content';

	cachedPaths = {
		source: normalisePath(hugoConfig.source) || '',
		archetypes: normalisePath(hugoConfig.archetypeDir) || 'archetypes',
		assets: normalisePath(hugoConfig.assetDir) || 'assets',
		content: contentDir,
		pages: contentDir,
		data: normalisePath(hugoConfig.dataDir) || 'data',
		layouts: normalisePath(hugoConfig.layoutDir) || 'layouts',
		publish: normalisePath(hugoConfig.destination || hugoConfig.publishDir) || 'public',
		static: staticDir,
		uploads: join(staticDir, normalisePath(hugoConfig.uploads_dir || hugoConfig.uploadsDir) || 'uploads'),
		config: normalisePath(hugoConfig.configDir) || ''
	};

	return cachedPaths;
}

export function getSupportedLanguages(hugoConfig = {}) {
	if (cachedLanguages) {
		return cachedLanguages;
	}

	cachedLanguages = hugoConfig?.languages ? Object.keys(hugoConfig.languages) : [];
	return cachedLanguages;
}

export function clearAllCachedItems() {
	clearCachedLanguages();
	clearCachedLayouts();
}

export function clearCachedLanguages() {
	cachedLanguages = null;
}

export function clearCachedLayouts() {
	cachedLayouts = null;
}

export function generatePaths(hugoConfig) {
	cachedPaths = null;
	getPaths(hugoConfig);
}

export async function getDataPaths() {
	const { source, data } = getPaths();
	return getGlob(join(source, data, '**'));
}

export async function getLayoutTree() {
	if (cachedLayouts) {
		return cachedLayouts;
	}

	const { source, layouts } = getPaths();
	const layoutPaths = await getLayoutPaths();

	cachedLayouts = layoutPaths.reduce((memo, layoutPath) => {
		layoutPath = layoutPath.replace(/\..+$/i, '');
		const relLayoutPath = layoutPath.replace(join(source, layouts, '/'), '');
		const parts = relLayoutPath.split('/');

		if (parts.length === 2) {
			if (!memo[parts[0]]) {
				memo[parts[0]] = {};
			}

			memo[parts[0]][parts[1]] = relLayoutPath;
		} else if (parts.length === 1) {
			memo[parts[0]] = relLayoutPath;
		}

		return memo;
	}, {});

	return cachedLayouts;
}

export async function getLayoutPaths() {
	const { source, layouts } = getPaths();
	return getGlob(join(source, layouts, '**'));
}

export async function getCollectionPaths(extraCollectionPaths = []) {
	const { source, content } = getPaths();

	const globPatterns = [
		join(source, content, '**'),
		...extraCollectionPaths.map((extraPath) => join(source, extraPath, '**'))
	];

	let collectionPaths = await getGlob(globPatterns);

	if (source) {
		collectionPaths = collectionPaths.map((item) => item.replace(`${source}/`, ''));
	}

	// remove empty strings and duplicates
	return Array.from(new Set(collectionPaths.filter((item) => item)));
}

export default {
	normalisePath,
	getPaths,
	getSupportedLanguages,
	clearCachedLayouts,
	clearCachedLanguages,
	clearAllCachedItems,
	generatePaths,
	getDataPaths,
	getLayoutTree,
	getLayoutPaths,
	getCollectionPaths
};
