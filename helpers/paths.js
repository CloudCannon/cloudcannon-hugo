const Path = require('path');
const globHelper = require('./globs');

module.exports = {
	getPaths: function (config = {}) {
		if (!this.cachedPaths) {
			this.cachedPaths = {
				archetypes: config.archetypeDir || 'archetypes',
				assets: config.assetDir || 'assets',
				content: config.contentDir || 'content',
				pages: config.contentDir || 'content',
				data: config.dataDir || 'data',
				layouts: config.layoutDir || 'layouts',
				publish: config.publishDir || 'public',
				static: config.staticDir || 'static',
				uploads: config.uploadsDir || `${config.staticDir || 'static'}/uploads`,
				themes: config.themesDir || 'themes',
				config: config.configDir || ''
			};
		}
		return this.cachedPaths;
	},

	generatePaths: function (config) {
		this.getPaths(config);
	},

	getDefaultsPaths: async function () {
		const { archetypes } = this.getPaths();
		const archetypeGlob = `**/${archetypes}/**/**.md`;

		return globHelper.getGlob(archetypeGlob);
	},

	getDataPaths: async function () {
		const { data } = this.getPaths();
		return globHelper.getGlob(`${data}/**`);
	},

	getLayoutTree: async function () {
		if (!this.cachedLayouts) {
			const tree = {};
			const { layouts } = this.getPaths();

			const layoutPaths = await this.getLayoutPaths();

			layoutPaths.forEach((layoutPath) => {
				layoutPath = layoutPath.replace(/\..+$/i, '');
				const relLayoutPath = layoutPath.replace(`${layouts}/`, '');
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
		const { layouts } = this.getPaths();
		return globHelper.getGlob(`${layouts}/**`);
	},

	/**
	 * top-level index files (e.g. /contact.md)
	 * index.md files in top-level folders (e.g. /about/index.md)
	 * _index.md files anywhere (e.g. /categories/authors/_index.md)
	 */
	getPagePaths: async function () {
		const { content } = this.getPaths();
		const contentFiles = await globHelper.getGlob([
			`**/${content}/**/*`
		]);

		const topLevelIndexRegex = new RegExp(`${content}/[^/]*/index.md$`, 'i');
		const listRegex = new RegExp(`${content}/.*/_index.md$`, 'i');
		const topLevelRegex = new RegExp(`${content}/[^/]*.md$`, 'i');

		const pagePaths = contentFiles.filter((path) => {
			if (topLevelIndexRegex.test(path) || topLevelRegex.test(path)) {
				return true;
			}

			if (listRegex.test(path)) {
				const dirName = Path.dirname(path);
				const matching = contentFiles.filter((item) => item.indexOf(dirName) >= 0);
				if (matching.length > 1) {
					return false;
				}
				return true;
			}
			return false;
		});

		// remove duplicates
		return Array.from(new Set(pagePaths));
	},

	getCollectionPaths: async function () {
		const { archetypes, content } = this.getPaths();
		const archetypeGlob = `**/${archetypes}/**/*.md`;
		const contentGlob = `**/${content}/*/**`;

		// TODO cache this
		const collectionPaths = await globHelper.getGlob([archetypeGlob, contentGlob],
			{ ignore: [`**/${archetypes}/default.md`, `**/${content}/**/index.md`] });

		// remove empty strings and duplicates
		return Array.from(new Set(collectionPaths.filter((item) => item)));
	}
};
