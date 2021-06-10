const { expect } = require('chai');
const mock = require('mock-fs');
const buildInfo = require('../../generators/build-info');
const { cloudCannonMeta } = require('../../helpers/metadata');
const pathHelper = require('../../helpers/paths');
const {
	collectionFiles,
	dataFiles,
	pages,
	testFileStructure
} = require('../test-paths');

const EXPECTED_GENERATOR = {
	name: 'hugo',
	version: '0.80.0',
	metadata: {
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
	}
};

const EXPECTED_DATA = {
	footer: [
		{ name: 'Github', order: 0 },
		{ name: 'RSS', order: 1 }
	],
	nav: [
		{ name: 'About', url: '/about/' },
		{ name: 'Contact', url: '/contact/' }
	],
	staff_members: {
		jane: { name: 'Jane Doe', title: 'Developer' },
		john: { name: 'John Smith', title: 'Designer' }
	}
};

describe('getCollectionNameConfig', function () {
	describe('contentDirectory', function () {
		const tests = [
			{ input: 'content/collectionName/_index.md', expected: 'collectionName', context: 'input: _index file' },
			{ input: 'content/authors/jane-doe.md', expected: undefined, context: 'input: no _index file' }
		];

		tests.forEach((test) => {
			it(test.context || '', function () {
				const result = buildInfo.getCollectionNameConfig(test.input, 'content');
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
				const result = buildInfo.getCollectionNameConfig(...test.input);
				expect(result).to.equal(test.expected);
			});
		});
	});
});

describe('getCollectionName', function () {
	const tests = [
		{ input: ['content/authors/jane-doe.md', 'content'], expected: 'authors', context: 'input: author collection' },
		{ input: ['data/staff/john.toml', 'data'], expected: 'staff', context: 'input: datafile' },
		{ input: ['content/posts/test-post/index.md', 'content'], expected: 'posts', context: 'post in page bundle' },
		{ input: ['nested/content/dir/_index.md', 'nested/content'], expected: 'dir', context: '_index page in nested content dir' }
	];

	tests.forEach((test) => {
		it(test.context || '', function () {
			const result = buildInfo.getCollectionName(...test.input);
			expect(result).to.equal(test.expected);
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
			const result = buildInfo.getPageUrl(...test.input);
			expect(result).to.equal(test.expected);
		});
	});
});

describe('getLayout', function () {
	before(function () {
		delete pathHelper.cachedLayouts;
		mock(testFileStructure);
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
			const result = await buildInfo.getLayout(...test.input);
			expect(result).to.equal(test.expected);
		});
	});

	after(function () {
		mock.restore();
		delete pathHelper.cachedLayouts;
	});
});

describe('generateCollectionsConfig', function () {
	before(function () {
		mock(collectionFiles);
	});

	it('should return all collections', async function () {
		const expected = {
			coll1: {
				path: 'content/coll1',
				output: true
			},
			posts: {
				path: 'content/posts',
				output: true,
				permalink: '/blog/:title/'
			},
			data: {
				path: 'data',
				output: false
			},
			leaf: {
				path: 'content/leaf',
				output: true
			},
			type: {
				path: 'content/type',
				output: false
			}
		};

		const results = await buildInfo.generateCollectionsConfig({ permalinks: { posts: '/blog/:title/', fakeCollection: 'wackyLink' } }, { content: 'content', archetypes: 'archetypes', data: 'data' });
		expect(results).to.deep.equal(expected);
	});

	after(function () {
		mock.restore();
	});
});

describe('generateMarkdownMetadata', function () {
	it('should return default markdown metadata', function () {
		const result = buildInfo.generateMarkdownMetadata({});
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

	it('should return default blackfriday metadata', function () {
		const result = buildInfo.generateMarkdownMetadata({ markup: { defaultMarkdownHandler: 'blackfriday' } });
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
				taskLists: true
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

		const result = buildInfo.generateMarkdownMetadata(markup);
		expect(result).to.deep.equal(expected);
	});
});

describe('generateData', function () {
	before(function () {
		mock(dataFiles);
	});

	it('should work', async function () {
		const dataObjects = await buildInfo.generateData({ cloudcannon: { data: true } });
		expect(dataObjects).to.deep.equal(EXPECTED_DATA);
	});

	after(function () {
		mock.restore();
	});
});

describe('generateCollections', function () {
	before(function () {
		mock(collectionFiles);
	});

	it('should retrieve collections', async function () {
		const urlsPerPath = {
			'content/coll1/item1.md': '/coll1/item1/',
			'content/coll1/item2.md': '/coll1/item2/',
			'content/posts/post1.md': '/posts/post1/'
		};

		const results = await buildInfo.generateCollections(urlsPerPath);
		const expected = {
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
			]
		};

		expect(results).to.deep.equal(expected);
	});

	after(function () {
		mock.restore();
	});
});

describe('generatePages', function () {
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
				draft: true,
				name: 'about.md',
				path: 'content/about.md',
				title: 'about.md',
				url: '',
				published: false
			},
			{
				name: '_index.md',
				path: 'content/contact/_index.md',
				title: '_index.md',
				url: '/contact/'
			},
			{
				headless: true,
				name: 'index.md',
				path: 'content/help/index.md',
				title: 'index.md',
				url: '/help/',
				output: false
			}
		];

		const results = await buildInfo.generatePages({});
		expect(results).to.deep.equal(expected);
	});

	after(function () {
		mock.restore();
	});
});

describe('generateInfo', function () {
	this.timeout(10000); // sometimes takes longer than 2000ms (default)

	it('work with no cloudcannon specific config', async function () {
		const expected = {
			time: '',
			generator: EXPECTED_GENERATOR,
			cloudcannon: cloudCannonMeta,
			source: '', // don't think hugo has custom src / mabe get this from cloudcannon
			'base-url': '/',
			'collections-config': { data: { path: 'data', output: false } },
			_comments: {},
			_options: {},
			_editor: {},
			_source_editor: {},
			paths: pathHelper.getPaths(),
			_array_structures: {},
			_select_data: {},
			collections: {},
			pages: []
		};

		const result = await buildInfo.generateInfo({ baseURL: '/' });

		[...new Set([...Object.keys(expected), ...Object.keys(result)])].forEach((key) => {
			if (key === 'time') {
				return;
			}

			expect(result[key]).to.deep.equal(expected[key]);
		});
	});

	it('work with cloudcannon specific config', async function () {
		const cloudcannon = {
			_comments: { comment: 'comment' },
			_options: { option: 'value' },
			_editor: { default_path: '/about/' },
			_sourceEditor: { theme: 'monokai', tab_size: 2, show_gutter: false },
			_arrayStructures: { object: {} },
			_selectData: { object: {} }
		};

		const expected = {
			time: '',
			generator: EXPECTED_GENERATOR,
			cloudcannon: cloudCannonMeta,
			source: '', // don't think hugo has custom src / mabe get this from cloudcannon
			'base-url': '/',
			'collections-config': { data: { path: 'data', output: false } },
			_comments: cloudcannon._comments,
			_options: cloudcannon._options,
			_editor: { default_path: '/about/' },
			_source_editor: { theme: 'monokai', tab_size: 2, show_gutter: false },
			paths: pathHelper.getPaths(),
			_array_structures: cloudcannon._arrayStructures,
			_select_data: cloudcannon._selectData,
			collections: {},
			pages: []
		};

		const result = await buildInfo.generateInfo({
			baseURL: '/',
			params: cloudcannon
		});

		[...new Set([...Object.keys(expected), ...Object.keys(result)])].forEach((key) => {
			if (key === 'time') {
				return;
			}

			expect(result[key]).to.deep.equal(expected[key]);
		});
	});

	describe('with data', async function () {
		before(function () {
			mock(dataFiles);
		});

		it('should return all data', async function () {
			const result = await buildInfo.generateInfo({
				cloudcannon: { data: true }
			});

			expect(result.data).to.deep.equal(EXPECTED_DATA);
		});

		it('should return the specified data', async function () {
			const expected = {
				nav: EXPECTED_DATA.nav,
				staff_members: EXPECTED_DATA.staff_members
			};

			const result = await buildInfo.generateInfo({
				cloudcannon: { data: { nav: true, staff_members: true } }
			});

			expect(result.data).to.deep.equal(expected);
		});
	});

	after(function () {
		mock.restore();
	});
});
