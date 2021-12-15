const { dirname, join } = require('path');
const { getGlob } = require('./globs');

let cachedPaths;
let cachedLanguages;
let cachedLayouts;

function getPaths(hugoConfig = {}) {
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
		publish: hugoConfig.destination || hugoConfig.publishDir || 'public',
		static: staticDir,
		uploads: join(staticDir, hugoConfig.uploads_dir || hugoConfig.uploadsDir || 'uploads'),
		config: hugoConfig.configDir || ''
	};

	return cachedPaths;
}

function getSupportedLanguages(hugoConfig = {}) {
	if (cachedLanguages) {
		return cachedLanguages;
	}

	cachedLanguages = hugoConfig?.languages ? Object.keys(hugoConfig.languages) : [];
	return cachedLanguages;
}

function clearCachedLayouts() {
	cachedLayouts = null;
}

function generatePaths(hugoConfig) {
	cachedPaths = null;
	getPaths(hugoConfig);
}

async function getDefaultsPaths() {
	const { source, archetypes } = getPaths();
	const archetypeGlob = join(source, archetypes, '**/**.md');

	return getGlob(archetypeGlob);
}

async function getDataPaths() {
	const { source, data } = getPaths();
	return getGlob(join(source, data, '**'));
}

async function getLayoutTree() {
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
		} else {
			memo[parts[0]] = relLayoutPath;
		}

		return memo;
	}, {});

	return cachedLayouts;
}

async function getLayoutPaths() {
	const { source, layouts } = getPaths();
	return getGlob(join(source, layouts, '**'));
}

/**
 * top-level index files (e.g. /contact.md)
 * index.md files in top-level folders (e.g. /about/index.md)
 * standalone _index.md files in top level folders (e.g. /contact/_index.md)
 */
async function getPagePaths() {
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

async function getCollectionPaths(extraCollectionPaths = []) {
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

module.exports = {
	getPaths,
	clearCachedLayouts,
	getSupportedLanguages,
	generatePaths,
	getDefaultsPaths,
	getDataPaths,
	getLayoutTree,
	getLayoutPaths,
	getPagePaths,
	getCollectionPaths
};
