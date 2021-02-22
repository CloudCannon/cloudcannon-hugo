/* eslint-disable prefer-arrow-callback */
const { expect } = require('chai');
const mock = require('mock-fs');

const buildDetails = require('../../generators/buildDetails');
const { cloudCannonMeta, markdownMeta } = require('../../helpers/metadata');

const { testFileStructure, collectionFiles, pages } = require('../test-paths');

describe('buildDetails', function () {
	describe('getMarkdownMeta', function () {
		it('should return default markdown metadata', function () {
			const result = buildDetails.getMarkdownMetadata({});
			expect(result).to.deep.equal(markdownMeta);
		});

		it('should return markup in config', function () {
			const markup = { kramdown: {} };
			const result = buildDetails.getMarkdownMetadata({ markup: markup });
			expect(result).to.deep.equal(markup);
		});
	});

	describe('getCollectionName()', function () {
		const tests = [
			{ input: 'content/authors/jane-doe.md', expected: 'authors', context: 'input: data file' }
		];

		tests.forEach((test) => {
			it(test.context || '', function () {
				const result = buildDetails.getCollectionName(test.input);
				expect(result).to.equal(test.expected);
			});
		});
	});

	describe('getPageUrl()', function () {
		const tests = [
			{ input: ['content/authors/_index.md', {}, 'content'], expected: '/authors/', context: 'input: _index file' },
			{ input: ['content/about/index.md', {}, 'content'], expected: '/about/', context: 'input: index file' }
		];

		tests.forEach((test) => {
			it(test.context || '', function () {
				const result = buildDetails.getPageUrl(...test.input);
				expect(result).to.equal(test.expected);
			});
		});
	});

	describe('getDataFiles()', function () {
		before(function () {
			mock(testFileStructure);
		});

		it('should work', async function () {
			const dataObjects = await buildDetails.getDataFiles('data');
			const expected = [{
				url: '',
				path: 'data/info.yml',
				collection: 'data',
				output: false
			}];
			expect(dataObjects).to.deep.equal(expected);
		});

		after(function () {
			mock.restore();
		});
	});

	describe('getCollections', function () {
		before(function () {
			mock(collectionFiles);
		});

		it('should retrieve collections', async function () {
			const urlsPerPath = {
				'content/coll1/item1.md': '/coll1/item1/',
				'content/coll1/item2.md': '/coll1/item2/',
				'content/posts/post1.md': '/posts/post1/'
			};
			const results = await buildDetails.getCollections(urlsPerPath);
			const expected = {
				coll1: [
					{
						collection: 'coll1',
						path: 'content/coll1/item1.md',
						url: '/coll1/item1/'
					},
					{
						collection: 'coll1',
						output: false,
						path: 'content/coll1/item2.md',
						url: '/coll1/item2/'
					}
				],
				posts: [
					{
						collection: 'posts',
						published: false,
						path: 'content/posts/post1.md',
						url: '/posts/post1/'
					}
				],
				data: [
					{
						collection: 'data',
						output: false,
						path: 'data/info.toml',
						url: ''
					}
				]
			};
			expect(results).to.deep.equal(expected);
		});

		after(function () {
			mock.restore();
		});
	});

	describe('getPages', function () {
		before(function () {
			mock(pages);
		});

		it('should retrieve only pages', async function () {
			const expected = [
				{
					name: '_index.md',
					path: 'content/_index.md',
					title: '_index.md',
					url: '/'
				},
				{
					name: 'about.md',
					path: 'content/about.md',
					title: 'about.md',
					url: '',
					published: false
				},
				{
					name: '_index.md',
					path: 'content/coll1/_index.md',
					title: '_index.md',
					url: '/coll1/'
				},
				{
					name: 'index.md',
					path: 'content/help/index.md',
					title: 'index.md',
					url: '/help/',
					output: false
				},
				{
					name: '_index.md',
					path: 'content/posts/_index.md',
					title: '_index.md',
					url: '/posts/'
				}
			];
			const results = await buildDetails.getPages({});

			expect(results).to.deep.equal(expected);
		});

		after(function () {
			mock.restore();
		});
	});

	describe('generateDetails', function () {
		this.timeout(10000); // can take slightly longer than 2000ms
		it('should return default details', async function () {
			const expected = {
				collections: {
					data: []
				},
				generator: {
					metadata: markdownMeta,
					name: 'hugo',
					version: '0.76.5'
				},
				cloudcannon: cloudCannonMeta,
				pages: [],
				time: ''
			};
			const result = await buildDetails.generateDetails({});
			Object.keys(result).forEach((key) => {
				if (key === 'generator') {
					return;
				}
				expect(result[key]).to.deep.equal(expected[key]);
			});
		});
	});
});
