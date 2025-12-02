import { mergeDeep, runProcess } from '../helpers/helpers.js';
import { markdownMeta } from '../helpers/metadata.js';

export function getGeneratorMetadata(hugoConfig, config) {
	const markup = hugoConfig.markup ?? {};
	const markdownHandler =
		config.generator?.metadata?.markdown || markup.defaultMarkdownHandler || 'goldmark';

	const defaultMeta = markdownMeta[markdownHandler] || {};
	const ccMarkdownSettings = config.generator?.metadata?.[markdownHandler] || {};
	const markdownSettings = mergeDeep({}, defaultMeta, markup[markdownHandler], ccMarkdownSettings);

	markdownSettings.renderer ||= {};
	markdownSettings.renderer.hardWraps = !!(
		markdownSettings.hardWraps ??
		markdownSettings.renderer.hardWraps ??
		false
	);

	return {
		markdown: markdownHandler,
		[markdownHandler]: markdownSettings,
	};
}

export async function getGenerator(hugoConfig, config) {
	const hugoVersion = await runProcess('hugo', ['version']);

	return {
		name: 'hugo',
		version: hugoVersion.match(/[0-9]+\.[0-9]+\.[0-9]+/g)?.[0] ?? '0.0.0',
		metadata: getGeneratorMetadata(hugoConfig, config),
	};
}
