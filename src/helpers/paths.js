const { dirname, join } = require('path');
const { getGlob } = require('./globs');

module.exports = {
	getPaths: function (config = {}) {
		if (!this.cachedPaths) {
			const staticDir = config.staticDir || 'static';
			const contentDir = config.contentDir || 'content';

			this.cachedPaths = {
				source: config.source || '',
				archetypes: config.archetypeDir || 'archetypes',
				assets: config.assetDir || 'assets',
				content: contentDir,
				pages: contentDir,
				data: config.dataDir || 'data',
				layouts: config.layoutDir || 'layouts',
				publish: config.destination || config.publishDir || 'public',
				static: staticDir,
				uploads: join(staticDir, config.uploads_dir || config.uploadsDir || 'uploads'),
				config: config.configDir || ''
			};
		}

		return this.cachedPaths;
	},

	generatePaths: function (config) {
		delete this.cachedPaths;
		this.getPaths(config);
	},

	getDefaultsPaths: async function () {
		const { source, archetypes } = this.getPaths();
		const archetypeGlob = join(source, archetypes, '**/**.md');

		return getGlob(archetypeGlob);
	},

	getDataPaths: async function () {
		const { source, data } = this.getPaths();
		return getGlob(join(source, data, '**'));
	},

	getLayoutTree: async function () {
		if (!this.cachedLayouts) {
			const tree = {};
			const { source, layouts } = this.getPaths();

			const layoutPaths = await this.getLayoutPaths();

			layoutPaths.forEach((layoutPath) => {
				layoutPath = layoutPath.replace(/\..+$/i, '');
				const relLayoutPath = layoutPath.replace(join(source, layouts, '/'), '');
				const parts = relLayoutPath.split('/');
				if (parts.length === 2) {
					if (!tree[parts[0]]) {
						tree[parts[0]] = {};
					}
					tree[parts[0]][parts[1]] = relLayoutPath;
				} else {
					tree[parts[0]] = relLayoutPath;
				}
			});
			this.cachedLayouts = tree;
		}
		return this.cachedLayouts;
	},

	getLayoutPaths: async function () {
		const { source, layouts } = this.getPaths();
		return getGlob(join(source, layouts, '**'));
	},

	/**
	 * top-level index files (e.g. /contact.md)
	 * index.md files in top-level folders (e.g. /about/index.md)
	 * standalone _index.md files in top level folders (e.g. /contact/_index.md)
	 */
	getPagePaths: async function () {
		const { source, content } = this.getPaths();
		const contentFiles = await getGlob([
			join(source, content, '**/*')
		]);

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
				if (matching.length > 1) {
					return false;
				}
				return true;
			}
			return false;
		});

		if (source) {
			pagePaths = pagePaths.map((path) => path.replace(`${source}/`, ''));
		}
		// remove duplicates
		return Array.from(new Set(pagePaths));
	},

	getCollectionPaths: async function (extraCollectionPaths = []) {
		const { source, archetypes, content } = this.getPaths();
		const mdArchetypeGlob = join(source, archetypes, '**/*.md');
		const htmlArchetypeGlob = join(source, archetypes, '**/*.html');
		const contentGlob = join(source, content, '*/**');
		const globPatterns = [mdArchetypeGlob, htmlArchetypeGlob, contentGlob];
		extraCollectionPaths.forEach((extraPath) => globPatterns.push(join(source, extraPath, '*.*')));

		let collectionPaths = await getGlob(globPatterns,
			{ ignore: [`**/${archetypes}/default.md`, `**/${content}/**/index.md`, `**/${content}/*.md`] });

		if (source) {
			collectionPaths = collectionPaths.map((item) => item.replace(`${source}/`, ''));
		}

		// remove empty strings and duplicates
		return Array.from(new Set(collectionPaths.filter((item) => item)));
	}
};
