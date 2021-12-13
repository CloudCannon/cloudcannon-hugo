const helpers = require('../helpers/helpers');
const { markdownMeta } = require('../helpers/metadata');

function getGeneratorMetadata(hugoConfig) {
	const markup = hugoConfig.markup ?? {};
	const markdownHandler = markup.defaultMarkdownHandler ?? 'goldmark';
	const defaultMeta = markdownMeta[markdownHandler] ?? {};

	return {
		markdown: markdownHandler,
		[markdownHandler]: helpers.mergeDeep(defaultMeta, markup[markdownHandler])
	};
}

function getGenerator(hugoConfig) {
	const hugoVersion = helpers.runProcess('hugo', ['version']);

	return {
		name: 'hugo',
		version: hugoVersion.match(/[0-9]+\.[0-9]+\.[0-9]+/g)?.[0] ?? '0.0.0',
		metadata: getGeneratorMetadata(hugoConfig)
	};
}

module.exports = {
	getGenerator,
	getGeneratorMetadata
};
