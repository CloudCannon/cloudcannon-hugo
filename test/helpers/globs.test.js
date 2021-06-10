const { expect } = require('chai');
const mock = require('mock-fs');

const globHelper = require('../../helpers/globs');

describe('globs', function () {
	describe('getGlobString()', function () {
		const tests = [
			{ input: ['glob1', 'glob2', 'glob3'], expected: '{glob1,glob2,glob3}', context: 'input: an array of glob patterns' },
			{ input: ['glob1'], expected: 'glob1', context: 'input: an array containing one glob pattern' },
			{ input: [], expected: '', context: 'input: empty array' }
		];

		tests.forEach((test) => {
			it(test.context || '', function () {
				const outputPattern = globHelper.getGlobString(test.input);
				expect(outputPattern).to.equal(test.expected);
			});
		});
	});

	describe('getGlob()', function () {
		before(function () {
			mock({
				archetypes: {
					'default.md': 'content'
				},
				content: {
					collectionName: {
						'index.md': 'content'
					},
					emptyCollection: {}
				},
				'theme/exampleSite': {
					'index.html': 'content'
				}
			});
		});
		const tests = [
			{
				input: ['archetypes/**', {}],
				expected: ['archetypes/default.md'],
				context: 'single glob'
			},
			{
				input: [['archetypes/**', '**/default.md'], {}],
				expected: ['archetypes/default.md'],
				context: 'multiple globs that return same file'
			},
			{
				input: [['archetypes/**', 'content/**'], {}],
				expected: ['archetypes/default.md', 'content/collectionName/index.md'],
				context: 'multiple globs in array'
			},
			{
				input: [['archetypes/**', 'content/**'], { ignore: '**/index.md' }],
				expected: ['archetypes/default.md'],
				context: 'multiple globs with ignore pattern'
			},
			{
				input: [['**'], { ignore: '**/index.md' }],
				expected: ['archetypes/default.md'],
				context: 'glob that includes exampleSite and ignore pattern'
			}
		];

		tests.forEach((test) => {
			it(test.context || '', async function () {
				const outputPattern = await globHelper.getGlob(...test.input);
				expect(outputPattern).to.deep.equal(test.expected);
			});
		});

		after(function () {
			mock.restore();
		});
	});
});
