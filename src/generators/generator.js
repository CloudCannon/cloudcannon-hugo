import { mergeDeep, runProcess } from '../helpers/helpers.js';
import { markdownMeta } from '../helpers/metadata.js';

export function getGeneratorMetadata(hugoConfig, config) {
	const markup = hugoConfig.markup ?? {};
	const hugoMarkdownHandler = markup.defaultMarkdownHandler ?? 'goldmark';
	const defaultMeta = markdownMeta[hugoMarkdownHandler] ?? {};
	const hugoMarkdownSettings = mergeDeep(defaultMeta, markup[hugoMarkdownHandler]);

	const ccMarkdownHandler = config.generator?.metadata?.markdown || hugoMarkdownHandler;
	const ccMarkdownSettings = config.generator?.metadata?.[ccMarkdownHandler] || {};

	// const markdownSettings = mergeDeep({}, hugoMarkdownSettings, ccMarkdownSettings);
	const markdownSettings = {
		...hugoMarkdownSettings,
		...ccMarkdownSettings
	};
	markdownSettings.renderer ||= {};

	markdownSettings.renderer.hardWraps = Object.hasOwn(markdownSettings, 'hardWraps')
		? markdownSettings.hardWraps
		: markdownSettings.renderer.hardWraps || false;

	return {
		markdown: ccMarkdownHandler,
		[ccMarkdownHandler]: markdownSettings
	};
}

export async function getGenerator(hugoConfig, config) {
	const hugoVersion = await runProcess('hugo', ['version']);

	return {
		name: 'hugo',
		version: hugoVersion.match(/[0-9]+\.[0-9]+\.[0-9]+/g)?.[0] ?? '0.0.0',
		metadata: getGeneratorMetadata(hugoConfig, config)
	};
}
