import { mergeDeep, runProcess } from '../helpers/helpers.js';
import { markdownMeta } from '../helpers/metadata.js';

function overrideHugoSettingsWithCloudCannonSettings(renderer, hugoSettings, ccSettings) {
	const newSettings = {
		...hugoSettings,
		...ccSettings
	};

	if (Object.hasOwn(ccSettings, 'hardWraps')) {
		if (renderer === 'goldmark') {
			if (Object.hasOwn(hugoSettings, 'renderer')) {
				newSettings.renderer.hardWraps = ccSettings.hardWraps;
			} else {
				newSettings.renderer = {
					hardWraps: ccSettings.hardWraps
				};
			}
		} else {
			newSettings.hardWraps = ccSettings.hardWraps;
		}
	}

	return newSettings;
}

export function getGeneratorMetadata(hugoConfig, config) {
	const markup = hugoConfig.markup ?? {};
	const hugoMarkdownHandler = markup.defaultMarkdownHandler ?? 'goldmark';
	const defaultMeta = markdownMeta[hugoMarkdownHandler] ?? {};
	const hugoMarkdownSettings = mergeDeep(defaultMeta, markup[hugoMarkdownHandler]);

	const ccMarkdownHandler = config.generator?.metadata?.markdown || hugoMarkdownHandler;
	const ccMarkdownSettings = config.generator?.metadata?.[ccMarkdownHandler] || {};

	const markdownSettings = hugoMarkdownHandler === ccMarkdownHandler
		? overrideHugoSettingsWithCloudCannonSettings(hugoMarkdownHandler, hugoMarkdownSettings, ccMarkdownSettings)
		: ccMarkdownSettings;

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
