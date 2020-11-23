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
				uploads: `${config.staticDir || 'static'}/uploads`,
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

	getPagePaths: async function () {
		const { content } = this.getPaths();
		const contentFiles = await globHelper.getGlob(`**/${content}/**/*.md`, { ignore: `**/${content}/*/*.md` });
		const indexFiles = await globHelper.getGlob(`**/${content}/**/*index.md`);

		// concat and remove duplicates
		return Array.from(new Set(contentFiles.concat(indexFiles)));
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
