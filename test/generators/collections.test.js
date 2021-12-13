const { expect } = require('chai');
const mock = require('mock-fs');
const {
	getCollectionNameConfig,
	getPageUrl,
	getLayout,
	generateCollectionsInfo
} = require('../../src/generators/collections');
const pathHelper = require('../../src/helpers/paths');
const { collectionFiles, testFileStructure } = require('../test-paths');

describe('getCollectionNameConfig', function () {
	describe('contentDirectory', function () {
		const tests = [
			{ input: 'content/collectionName/_index.md', expected: 'collectionName', context: 'input: _index file' },
			{ input: 'content/authors/jane-doe.md', expected: 'authors', context: 'input: no _index file' },
			{ input: 'content/authors/nested/file/path/jane-doe.md', expected: 'authors', context: 'input: nested, no _index file' }
		];

		tests.forEach((test) => {
			it(test.context || '', function () {
				const result = getCollectionNameConfig(test.input, 'content');
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
				const result = getCollectionNameConfig(...test.input);
				expect(result).to.equal(test.expected);
			});
		});
	});
});

describe('getPageUrl', function () {
	const tests = [
		{ input: ['content/authors/_index.md', {}, 'content'], expected: '/authors/', context: 'input: _index file' },
		{ input: ['content/about/index.md', {}, 'content'], expected: '/about/', context: 'input: index file' }
	];

	tests.forEach((test) => {
		it(test.context || '', function () {
			const result = getPageUrl(...test.input);
			expect(result).to.equal(test.expected);
		});
	});
});

describe('getLayout', function () {
	before(function () {
		delete pathHelper.cachedLayouts;
		mock(testFileStructure);
		pathHelper.getSupportedLanguages({ languages: { en: {} } });
	});

	const tests = [
		{
			input: ['content/_index.md', {}],
			expected: 'index',
			context: 'input: Home page'
		},
		{
			input: ['content/_index.md', { type: 'mytype' }],
			expected: 'mytype/list',
			context: 'input: Home page with type set'
		},
		{
			input: ['content/_index.md', { layout: 'mylayout' }],
			expected: 'index',
			context: 'input: Home page with layout set'
		},
		{
			input: ['content/posts/post.md', {}],
			expected: 'posts/single',
			context: 'input: single post'
		},
		{
			input: ['content/posts/item/index.md', {}],
			expected: 'posts/single',
			context: 'input: single leaf bundle post'
		},
		{
			input: ['content/en/posts/item/index.md', {}],
			expected: 'posts/single',
			context: 'input: single leaf bundle post in a language code'
		},
		{
			input: ['content/posts/post.md', { layout: 'mylayout' }],
			expected: 'posts/mylayout',
			context: 'input: single post with layout set'
		},
		{
			input: ['content/posts/post.md', { type: 'invalidType' }],
			expected: 'posts/single',
			context: 'input: single post with a non-existent type set'
		},
		{
			input: ['content/posts/_index.md', {}],
			expected: '_default/list',
			context: 'input: list page for posts'
		},
		{
			input: ['content/mytype/_index.md', {}],
			expected: 'mytype/list',
			context: 'input: list page for mytype'
		},
		{
			input: ['content/posts/_index.md', { type: 'mytype' }],
			expected: 'mytype/list',
			context: 'input: list page for posts with type mytype'
		},
		{
			input: ['content/posts/_index.md', { layout: 'mylayout' }],
			expected: 'posts/mylayout',
			context: 'input: list page for posts with layout set'
		},
		{
			input: ['content/posts/_index.md', { type: 'mytype', layout: 'mylayout' }],
			expected: 'mytype/mylayout',
			context: 'input: list page for posts with type and layout set'
		}
	];

	tests.forEach((test) => {
		it(test.context || '', async function () {
			const result = await getLayout(...test.input);
			expect(result).to.equal(test.expected);
		});
	});

	after(function () {
		mock.restore();
		delete pathHelper.cachedLayouts;
	});
});

describe('generateCollectionsInfo', function () {
	before(function () {
		const fileStructure = {
			...collectionFiles,
			'data/staff_members': { 'anna.yml': '' }
		};
		mock(fileStructure);
	});

	it('should retrieve collections', async function () {
		const urlsPerPath = {
			'content/coll1/item1.md': '/coll1/item1/',
			'content/coll1/item2.md': '/coll1/item2/',
			'content/posts/post1.md': '/posts/post1/'
		};

		const hugoConfig = {
			cloudcannon: {
				collections: {
					data: { _image_key: 'thumbnail' },
					posts: { _image_key: 'author_image', _image_size: 'cover' },
					fakeCollection: 'wackyLink',
					staff_members: { path: 'data/staff_members' }
				}
			}
		};

		const {
			collections, collectionsConfig
		} = await generateCollectionsInfo(hugoConfig, urlsPerPath);
		const expectedCollections = {
			coll1: [
				{
					collection: 'coll1',
					path: 'content/coll1/_index.md',
					url: '/coll1/'
				},
				{
					collection: 'coll1',
					path: 'content/coll1/item1.md',
					url: '/coll1/item1/'
				},
				{
					collection: 'coll1',
					headless: true,
					output: false,
					path: 'content/coll1/item2.md',
					url: '/coll1/item2/'
				}
			],
			posts: [
				{
					collection: 'posts',
					path: 'content/posts/_index.md',
					url: '/posts/'
				},
				{
					collection: 'posts',
					draft: true,
					published: false,
					path: 'content/posts/post1.md',
					url: '/posts/post1/'
				}
			],
			staff_members: [
				{
					collection: 'staff_members',
					output: false,
					path: 'data/staff_members/anna.yml',
					url: ''
				}
			],
			leaf: [],
			type: []
		};

		const expectedCollectionsConfig = {
			coll1: {
				path: 'content/coll1',
				output: true
			},
			posts: {
				path: 'content/posts',
				output: true,
				_image_key: 'author_image',
				_image_size: 'cover'
			},
			data: {
				path: 'data',
				output: false,
				_image_key: 'thumbnail'
			},
			leaf: {
				path: 'content/leaf',
				output: true
			},
			type: {
				path: 'content/type',
				output: false
			},
			staff_members: {
				path: 'data/staff_members',
				output: false
			}
		};

		expect(collections).to.deep.equal(expectedCollections);
		expect(collectionsConfig).to.deep.equal(expectedCollectionsConfig);
	});

	after(function () {
		mock.restore();
	});
});
