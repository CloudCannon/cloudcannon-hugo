import { dirname, join } from 'path';
import { getGlob } from './globs.js';

let cachedPaths;
let cachedLanguages;
let cachedLayouts;

export function getPaths(hugoConfig = {}) {
	if (cachedPaths) {
		return cachedPaths;
	}

	const staticDir = hugoConfig.staticDir || 'static';
	const contentDir = hugoConfig.contentDir || 'content';

	cachedPaths = {
		source: hugoConfig.source || '',
		archetypes: hugoConfig.archetypeDir || 'archetypes',
		assets: hugoConfig.assetDir || 'assets',
		content: contentDir,
		pages: contentDir,
		data: hugoConfig.dataDir || 'data',
		layouts: hugoConfig.layoutDir || 'layouts',
		theme: hugoConfig.themesDir || 'themes',
		themeList: hugoConfig.theme || [],
		publish: hugoConfig.destination || hugoConfig.publishDir || 'public',
		static: staticDir,
		uploads: join(staticDir, hugoConfig.uploads_dir || hugoConfig.uploadsDir || 'uploads'),
		config: hugoConfig.configDir || ''
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

export function clearCachedLayouts() {
	cachedLayouts = null;
}

export function generatePaths(hugoConfig) {
	cachedPaths = null;
	getPaths(hugoConfig);
}

export async function getDefaultsPaths() {
	const { source, archetypes } = getPaths();
	const archetypeGlob = join(source, archetypes, '**/**.md');

	return getGlob(archetypeGlob);
}

export async function getDataPaths() {
	const { source, data } = getPaths();
	return getGlob(join(source, data, '**'));
}

export async function getLayoutTree() {
	if (cachedLayouts) {
		return cachedLayouts;
	}

	const { source, layouts, theme, themeList } = getPaths();
	const layoutPaths = await getLayoutPaths();

	cachedLayouts = layoutPaths.reduce((memo, layoutPath) => {
		layoutPath = layoutPath.replace(/\..+$/i, '');
		let layoutSource;
		let relLayoutPath;

		if (layoutPath.indexOf(join(source, layouts)) === 0) {
			layoutSource = 'source';
			relLayoutPath = layoutPath.replace(join(source, layouts, '/'), '');
		} else {
			const themePath = layoutPath.replace(join(source, theme, '/'), '');
			layoutSource = themeList.find(themeName => themePath.indexOf(themeName) === 0);
			if (!layoutSource) {
				return memo;
			}
			relLayoutPath = themePath.replace(join(layoutSource, 'layouts', '/'), '');
		}

		memo[layoutSource] = memo[layoutSource] || {};

		const parts = relLayoutPath.split('/');

		if (parts.length === 2) {
			if (!memo[layoutSource][parts[0]]) {
				memo[layoutSource][parts[0]] = {};
			}

			memo[layoutSource][parts[0]][parts[1]] = relLayoutPath;
		} else if (parts.length === 1) {
			memo[layoutSource][parts[0]] = relLayoutPath;
		}

		return memo;
	}, {});

	return cachedLayouts;
}

export async function getLayoutPaths() {
	const { source, layouts, theme } = getPaths();
	const sourceLayoutGlob = join(source, layouts, '**');
	const themeLayoutGlob = join(source, theme, '**/layouts/**');
	return getGlob([sourceLayoutGlob, themeLayoutGlob]);
}

/**
 * top-level index files (e.g. /contact.md)
 * index.md files in top-level folders (e.g. /about/index.md)
 * standalone _index.md files in top level folders (e.g. /contact/_index.md)
 */
export async function getPagePaths() {
	const { source, content } = getPaths();
	const contentFiles = await getGlob([join(source, content, '**/*')]);

	const topLevelRegex = new RegExp(`${content}/[^/]*.md$`, 'i');
	const topLevelIndexRegex = new RegExp(`${content}/[^/]*/index.md$`, 'i');
	const listRegex = new RegExp(`${content}/[^/]*/_index.md$`, 'i');

	let pagePaths = contentFiles.filter((path) => {
		if (topLevelIndexRegex.test(path) || topLevelRegex.test(path)) {
			return true;
		}

		if (listRegex.test(path)) {
			const dirName = dirname(path);
			const matching = contentFiles.filter((item) => item.indexOf(dirName) >= 0);
			return matching.length <= 1;
		}

		return false;
	});

	if (source) {
		pagePaths = pagePaths.map((path) => path.replace(`${source}/`, ''));
	}

	// remove duplicates
	return Array.from(new Set(pagePaths));
}

export async function getCollectionPaths(extraCollectionPaths = []) {
	const { source, archetypes, content } = getPaths();
	const mdArchetypeGlob = join(source, archetypes, '**/*.md');
	const htmlArchetypeGlob = join(source, archetypes, '**/*.html');
	const contentGlob = join(source, content, '*/**');
	const globPatterns = [mdArchetypeGlob, htmlArchetypeGlob, contentGlob];

	extraCollectionPaths.forEach((extraPath) => globPatterns.push(join(source, extraPath, '*.*')));

	let collectionPaths = await getGlob(globPatterns, {
		ignore: [
			`**/${archetypes}/default.md`,
			`**/${content}/**/index.md`,
			`**/${content}/*.md`
		]
	});

	if (source) {
		collectionPaths = collectionPaths.map((item) => item.replace(`${source}/`, ''));
	}

	// remove empty strings and duplicates
	return Array.from(new Set(collectionPaths.filter((item) => item)));
}

export default {
	getPaths,
	getSupportedLanguages,
	clearCachedLayouts,
	generatePaths,
	getDefaultsPaths,
	getDataPaths,
	getLayoutTree,
	getLayoutPaths,
	getPagePaths,
	getCollectionPaths
};