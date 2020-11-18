/* eslint-disable prefer-arrow-callback */
const { expect } = require('chai');

const buildConfig = require('../../generators/buildConfig');

describe('buildConfig', function () {
	describe('getCollectionName', function () {
		describe('contentDirectory', function () {
			const tests = [
				{ input: 'content/collectionName/_index.md', expected: 'collectionName', context: 'input: _index file' },
				{ input: 'content/authors/jane-doe.md', expected: undefined, context: 'input: no _index file' }
			];

			tests.forEach((test) => {
				it(test.context || '', function () {
					const result = buildConfig.getCollectionName(test.input);
					expect(result).to.equal(test.expected);
				});
			});
		});
		describe('archetypes', function () {
			const tests = [
				{ input: ['archetypes/archetypeName/index.md', 'archetypes'], expected: 'archetypeName', context: 'input: index file' },
				{ input: ['archetypes/someFolder/archetype.md', 'archetypes'], expected: 'archetype', context: 'input: no index file' },
				{ input: ['archetypes/archetypeName.md', 'archetypes'], expected: 'archetypeName', context: 'input: item in root archetype dir' },
				{ input: ['archetypes/default.md', 'archetypes'], expected: undefined, context: 'default archetype' }
			];
			tests.forEach((test) => {
				it(test.context || '', function () {
					const result = buildConfig.getCollectionName(...test.input);
					expect(result).to.equal(test.expected);
				});
			});
		});
	});
});
