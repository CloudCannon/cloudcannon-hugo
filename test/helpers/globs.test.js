import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import mock from 'mock-fs';
import { getGlob, getGlobString } from '../../src/helpers/globs.js';

describe('globs', () => {
	describe('getGlobString()', () => {
		const tests = [
			{
				input: ['glob1', 'glob2', 'glob3'],
				expected: '{glob1,glob2,glob3}',
				context: 'input: an array of glob patterns',
			},
			{
				input: ['glob1'],
				expected: 'glob1',
				context: 'input: an array containing one glob pattern',
			},
			{ input: [], expected: '', context: 'input: empty array' },
		];

		tests.forEach((test) => {
			it(test.context || '', () => {
				const outputPattern = getGlobString(test.input);
				assert.strictEqual(outputPattern, test.expected);
			});
		});
	});

	describe('getGlob()', () => {
		before(() => {
			mock({
				archetypes: {
					'default.md': 'content',
				},
				content: {
					collectionName: {
						'index.md': 'content',
					},
					emptyCollection: {},
				},
				'theme/exampleSite': {
					'index.html': 'content',
				},
			});
		});
		const tests = [
			{
				input: ['archetypes/**', {}],
				expected: ['archetypes/default.md'],
				context: 'single glob',
			},
			{
				input: [['archetypes/**', '**/default.md'], {}],
				expected: ['archetypes/default.md'],
				context: 'multiple globs that return same file',
			},
			{
				input: [['archetypes/**', 'content/**'], {}],
				expected: ['archetypes/default.md', 'content/collectionName/index.md'],
				context: 'multiple globs in array',
			},
			{
				input: [['archetypes/**', 'content/**'], { ignore: '**/index.md' }],
				expected: ['archetypes/default.md'],
				context: 'multiple globs with ignore pattern',
			},
			{
				input: [['**'], { ignore: '**/index.md' }],
				expected: ['archetypes/default.md'],
				context: 'glob that includes exampleSite and ignore pattern',
			},
		];

		tests.forEach((test) => {
			it(test.context || '', async () => {
				const outputPattern = await getGlob(...test.input);
				assert.deepStrictEqual(outputPattern, test.expected);
			});
		});

		after(() => {
			mock.restore();
		});
	});
});
