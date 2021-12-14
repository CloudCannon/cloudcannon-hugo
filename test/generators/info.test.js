const { expect } = require('chai');
const mock = require('mock-fs');
const { getInfo } = require('../../src/generators/info');
const { version } = require('../../src/helpers/metadata');
const pathHelper = require('../../src/helpers/paths');
const { dataFiles } = require('../test-paths');

const EXPECTED_GENERATOR = {
	name: 'hugo',
	version: '0.0.0', // This will probably fail locally
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

describe('getInfo', function () {
	this.timeout(10000); // sometimes takes longer than 2000ms (default)

	it('work with no cloudcannon specific config', async function () {
		const expected = {
			time: 'TODO', // TODO
			version: version,
			generator: EXPECTED_GENERATOR,
			cloudcannon: {
				name: 'cloudcannon-hugo',
				version: '0.0.0'
			},
			source: '', // don't think hugo has custom src / mabe get this from cloudcannon
			'base-url': '/',
			'collections-config': { data: { path: 'data', output: false } },
			_comments: {},
			_options: {},
			_editor: {},
			_source_editor: {},
			_array_structures: {},
			_select_data: {},
			paths: pathHelper.getPaths(),
			collections: {}
		};

		const result = await getInfo({ baseURL: '/' });

		[...new Set([...Object.keys(expected), ...Object.keys(result)])].forEach((key) => {
			if (key === 'time' || key === 'generator') { // TODO mock these instead
				return;
			}

			expect(result[key]).to.deep.equal(expected[key]);
		});
	});

	it('work with cloudcannon specific config', async function () {
		const cloudcannon = {
			_comments: { comment: 'comment' },
			_options: { option: 'value' },
			_inputs: {},
			_editables: {},
			_editor: { default_path: '/about/' },
			_source_editor: { theme: 'monokai', tab_size: 2, show_gutter: false },
			_structures: {},
			_array_structures: { object: {} },
			_select_data: { object: {} }
		};

		const expected = {
			time: 'TODO', // TODO,
			version: version,
			generator: EXPECTED_GENERATOR,
			cloudcannon: {
				name: 'cloudcannon-hugo',
				version: '0.0.1'
			},
			source: '', // TODO
			'base-url': '/',
			'collections-config': { data: { path: 'data', output: false } },
			...cloudcannon,
			paths: pathHelper.getPaths(),
			collections: {}
		};

		const result = await getInfo({
			baseURL: '/',
			...cloudcannon
		}, { version: '0.0.1' });

		[...new Set([...Object.keys(expected), ...Object.keys(result)])].forEach((key) => {
			if (key === 'time' || key === 'generator') { // TODO mock these instead
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
			const result = await getInfo({ cloudcannon: { data: true } });

			expect(result.data).to.deep.equal(EXPECTED_DATA);
		});

		it('should return the specified data', async function () {
			const expected = {
				nav: EXPECTED_DATA.nav,
				staff_members: EXPECTED_DATA.staff_members
			};

			const result = await getInfo({
				cloudcannon: { data: { nav: true, staff_members: true } }
			});

			expect(result.data).to.deep.equal(expected);
		});
	});

	after(function () {
		mock.restore();
	});
});
