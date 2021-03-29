/* eslint-disable prefer-arrow-callback */
/* eslint-disable quote-props */
/* eslint-disable dot-notation */
const { expect } = require('chai');
const mock = require('mock-fs');

const { collectionFiles } = require('../test-paths');
const { cloudCannonMeta } = require('../../helpers/metadata');
const buildConfig = require('../../generators/buildConfig');
const pathHelper = require('../../helpers/paths');

describe('buildConfig', function () {
	describe('getCollectionName', function () {
		describe('contentDirectory', function () {
			const tests = [
				{ input: 'content/collectionName/_index.md', expected: 'collectionName', context: 'input: _index file' },
				{ input: 'content/authors/jane-doe.md', expected: undefined, context: 'input: no _index file' }
			];

			tests.forEach((test) => {
				it(test.context || '', function () {
					const result = buildConfig.getCollectionName(test.input, 'content');
					expect(result).to.equal(test.expected);
				});
			});
		});
		describe('archetypes', function () {
			const tests = [
				{ input: ['archetypes/archetypeName/index.md', 'content', 'archetypes'], expected: 'archetypeName', context: 'input: index file' },
				{ input: ['archetypes/someFolder/archetype.md', 'content', 'archetypes'], expected: 'archetype', context: 'input: no index file' },
				{ input: ['archetypes/archetypeName.md', 'content', 'archetypes'], expected: 'archetypeName', context: 'input: item in root archetype dir' },
				{ input: ['archetypes/default.md', 'content', 'archetypes'], expected: undefined, context: 'default archetype' }
			];
			tests.forEach((test) => {
				it(test.context || '', function () {
					const result = buildConfig.getCollectionName(...test.input);
					expect(result).to.equal(test.expected);
				});
			});
		});
	});

	describe('generateCollection', function () {
		before(function () {
			mock(collectionFiles);
		});

		it('should return all collections', async function () {
			const expected = {
				coll1: {
					_path: 'content/coll1',
					output: true
				},
				posts: {
					_path: 'content/posts',
					output: true,
					permalink: '/blog/:title/'
				},
				data: {
					_path: 'data',
					output: false
				},
				leaf: {
					_path: 'content/leaf',
					output: true
				},
				type: {
					_path: 'content/type',
					output: false
				}
			};
			const results = await buildConfig.generateCollections({ permalinks: { posts: '/blog/:title/', fakeCollection: 'wackyLink' } }, { content: 'content', archetypes: 'archetypes', data: 'data' });
			expect(results).to.deep.equal(expected);
		});

		after(function () {
			mock.restore();
		});
	});

	describe('generateConfig', function () {
		this.timeout(10000); // sometimes takes longer than 2000ms (default)
		it('work with no cloudcannon specific config', async function () {
			const expected = {
				'time': '',
				'cloudcannon': cloudCannonMeta,
				'source': '', // don't think hugo has custom src / mabe get this from cloudcannon
				'include': [],
				'exclude': [],
				'base-url': '/',
				'collections': {
					'data': {
						'_path': 'data',
						'output': false
					}
				},
				'comments': {},
				'input-options': {},
				'defaults': [], // Currently Unused
				'editor': {},
				'source-editor': {},
				'explore': {},
				'paths': pathHelper.getPaths(),
				'array-structures': {},
				'select-data': {}
			};

			const result = await buildConfig.generateConfig({ baseURL: '/' });
			Object.keys(result).forEach((key) => {
				if (key === 'time') {
					return;
				}
				expect(result[key]).to.deep.equal(expected[key]);
			});
		});

		it('work with cloudcannon specific config', async function () {
			const cloudcannon = {
				'include': ['include'],
				'exclude': ['exclude'],
				'_comments': { 'comment': 'comment' },
				'_options': { 'option': 'value' },
				'_editor': { default_path: '/about/' },
				'_sourceEditor': { theme: 'monokai', tab_size: 2, show_gutter: false },
				'_explore': { 'groups': [] },
				'_array_structures': { 'object': {} },
				'_selectData': { 'object': {} }
			};

			const expected = {
				'time': '',
				'cloudcannon': cloudCannonMeta,
				'source': '', // don't think hugo has custom src / mabe get this from cloudcannon
				'include': cloudcannon.include,
				'exclude': cloudcannon.exclude,
				'base-url': '/',
				'collections': {
					'data': {
						'_path': 'data',
						'output': false
					}
				},
				'comments': cloudcannon['_comments'],
				'input-options': cloudcannon['_options'],
				'defaults': [], // Currently Unused
				'editor': { 'default-path': '/about/' },
				'source-editor': { theme: 'monokai', 'tab-size': 2, 'show-gutter': false },
				'explore': cloudcannon['_explore'],
				'paths': pathHelper.getPaths(),
				'array-structures': cloudcannon['_array_structures'],
				'select-data': cloudcannon['_selectData']
			};

			const result = await buildConfig.generateConfig({ baseURL: '/', params: cloudcannon });
			Object.keys(result).forEach((key) => {
				if (key === 'time') {
					return;
				}
				expect(result[key]).to.deep.equal(expected[key]);
			});
		});
	});
});
