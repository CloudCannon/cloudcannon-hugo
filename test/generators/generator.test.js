import { expect } from 'chai';
import { getGeneratorMetadata } from '../../src/generators/generator.js';

describe('getGeneratorMetadata', function () {
	it('should return default markdown metadata', function () {
		const result = getGeneratorMetadata({}, {});
		const expected = {
			markdown: 'goldmark',
			goldmark: {
				extensions: {
					definitionList: true,
					footnote: true,
					linkify: true,
					strikethrough: true,
					table: true,
					taskList: true,
					typographer: true
				},
				parser: {
					attribute: true,
					autoHeadingID: true,
					autoHeadingIDType: 'github'
				},
				renderer: {
					hardWraps: false,
					unsafe: false,
					xhtml: false
				}
			}
		};

		expect(result).to.deep.equal(expected);
	});

	it('should overwrite default markdown metadata with cloudcannon markdown metadata', function () {
		const markup = { markup: { goldmark: { renderer: { unsafe: true, hardWraps: true } } } };
		const ccConfig = { generator: { metadata: { goldmark: { hardWraps: false, sentence_per_line: true } } } };

		const result = getGeneratorMetadata(markup, ccConfig);
		const expected = {
			markdown: 'goldmark',
			goldmark: {
				extensions: {
					definitionList: true,
					footnote: true,
					linkify: true,
					strikethrough: true,
					table: true,
					taskList: true,
					typographer: true
				},
				parser: {
					attribute: true,
					autoHeadingID: true,
					autoHeadingIDType: 'github'
				},
				renderer: {
					hardWraps: false,
					unsafe: true,
					xhtml: false
				},
				hardWraps: false,
				sentence_per_line: true
			}
		};

		expect(result).to.deep.equal(expected);
	});

	it('should return default blackfriday metadata', function () {
		const result = getGeneratorMetadata({ markup: { defaultMarkdownHandler: 'blackfriday' } }, {});
		const expected = {
			markdown: 'blackfriday',
			blackfriday: {
				angledQuotes: false,
				extensions: null,
				extensionsMask: null,
				footnoteAnchorPrefix: '',
				footnoteReturnLinkContents: '',
				fractions: true,
				hrefTargetBlank: false,
				latexDashes: true,
				nofollowLinks: false,
				noreferrerLinks: false,
				plainIDAnchors: true,
				skipHTML: false,
				smartDashes: true,
				smartypants: true,
				smartypantsQuotesNBSP: false,
				taskLists: true,
				renderer: {
					hardWraps: false
				}
			}
		};

		expect(result).to.deep.equal(expected);
	});

	it('should return markup in config', function () {
		const markup = { markup: { goldmark: { renderer: { unsafe: true } } } };
		const expected = {
			markdown: 'goldmark',
			goldmark: {
				extensions: {
					definitionList: true,
					footnote: true,
					linkify: true,
					strikethrough: true,
					table: true,
					taskList: true,
					typographer: true
				},
				parser: {
					attribute: true,
					autoHeadingID: true,
					autoHeadingIDType: 'github'
				},
				renderer: {
					hardWraps: false,
					unsafe: true,
					xhtml: false
				}
			}
		};

		const result = getGeneratorMetadata(markup, {});
		expect(result).to.deep.equal(expected);
	});
});
