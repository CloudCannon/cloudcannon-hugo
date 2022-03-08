import { mergeDeep, runProcess } from '../helpers/helpers.js';
import { markdownMeta } from '../helpers/metadata.js';

export function getGeneratorMetadata(hugoConfig) {
	const markup = hugoConfig.markup ?? {};
	const markdownHandler = markup.defaultMarkdownHandler ?? 'goldmark';
	const defaultMeta = markdownMeta[markdownHandler] ?? {};

	return {
		markdown: markdownHandler,
		[markdownHandler]: mergeDeep(defaultMeta, markup[markdownHandler])
	};
}

export async function getGenerator(hugoConfig) {
	const hugoVersion = await runProcess('hugo', ['version']);

	return {
		name: 'hugo',
		version: hugoVersion.match(/[0-9]+\.[0-9]+\.[0-9]+/g)?.[0] ?? '0.0.0',
		metadata: getGeneratorMetadata(hugoConfig)
	};
}
