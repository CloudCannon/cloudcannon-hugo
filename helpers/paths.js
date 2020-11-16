const globHelper = require('./globs');

module.exports = {
	getPaths: function (config) {
		if (!this.cachedPaths) {
			this.cachedPaths = {
				archetypes: config.archetypeDir || 'archetypes',
				assets: config.assetDir || 'assets',
				content: config.contentDir || 'content',
				pages: config.contentDir || 'content',
				data: config.dataDir || 'data',
				layouts: config.layoutDir || 'layouts',
				publish: config.publishDir || 'public',
				uploads: `${config.staticDir}/uploads` || 'static/uploads',
				themes: config.themesDir || 'themes',
				config: config.configDir || ''
			};
		}
		return this.cachedPaths;
	},

	generatePaths: function (config) {
		this.getPaths(config);
	},

	getDefaultsPaths: async function (paths) {
		const indexGlob = `**/${paths.content}/**/_index.md`;
		const archetypeGlob = `**/${paths.archetypes}/**/**.md`;

		return globHelper.getGlob([indexGlob, archetypeGlob]);
	},

	getDataPaths: async function (dataPath) {
		return globHelper.getGlob(dataPath) || [];
	},

	getPagePaths: async function (paths) {
		const contentFiles = await globHelper.getGlob(`**/${paths.content}/**/*.md`, { ignore: `**/${paths.content}/*/*.md` });
		const indexFiles = await globHelper.getGlob(`**/${paths.content}/**/*index.md`);

		// concat and remove duplicates
		return Array.from(new Set(contentFiles.concat(indexFiles)));
	},

	getCollectionPaths: async function (paths) {
		const archetypeGlob = `**/${paths.archetypes}/**/**.md`;
		const contentGlob = `**/${paths.content}/*/**`;

		// TODO cache this
		const collectionPaths = await globHelper.getGlob([archetypeGlob, contentGlob], { ignore: `**/${paths.archetypes}/default.md` });

		// remove empty strings and duplicates
		return Array.from(new Set(collectionPaths.filter((item) => item)));
	}
};
