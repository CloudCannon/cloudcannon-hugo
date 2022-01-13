import { expect } from 'chai';
import mock from 'mock-fs';
import { getInfo } from '../../src/generators/info.js';
import pathHelper from '../../src/helpers/paths.js';
import { dataFiles } from '../test-paths.js';

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

describe('info generator', function () {
	this.timeout(10000); // sometimes takes longer than 2000ms (default)

	const untested = {
		time: 'UNTESTED',
		generator: 'UNTESTED'
	};

	it('with no cloudcannon specific config', async function () {
		const expected = {
			source: '',
			base_url: '',
			data_config: undefined,
			_comments: undefined,
			_options: undefined,
			_inputs: undefined,
			_editables: undefined,
			collection_groups: undefined,
			editor: undefined,
			source_editor: undefined,
			_enabled_editors: undefined,
			_instance_values: undefined,
			_structures: undefined,
			_array_structures: undefined,
			_select_data: undefined,
			paths: pathHelper.getPaths(),
			version: '0.0.3',
			cloudcannon: {
				name: 'cloudcannon-hugo',
				version: '0.0.0'
			},
			collections_config: {
				data: {
					path: 'data',
					output: false
				}
			},
			collections: {},
			data: undefined
		};

		const result = await getInfo({ baseURL: '/' });

		expect({ ...result, ...untested }).to.deep.equal({ ...expected, ...untested });
	});

	it('with cloudcannon specific config', async function () {
		const cloudcannon = {
			_comments: { comment: 'comment' },
			_options: { option: 'value' },
			_inputs: {},
			_editables: {},
			editor: { default_path: '/about/' },
			source_editor: { theme: 'monokai', tab_size: 2, show_gutter: false },
			_structures: {},
			_array_structures: { object: {} },
			_select_data: { object: {} }
		};

		const expected = {
			source: '',
			base_url: '',
			data_config: undefined,
			_comments: { comment: 'comment' },
			_options: { option: 'value' },
			_inputs: {},
			_editables: {},
			collection_groups: undefined,
			editor: { default_path: '/about/' },
			source_editor: { theme: 'monokai', tab_size: 2, show_gutter: false },
			_enabled_editors: undefined,
			_instance_values: undefined,
			_structures: {},
			_array_structures: { object: {} },
			_select_data: { object: {} },
			paths: pathHelper.getPaths(),
			version: '0.0.3',
			cloudcannon: {
				name: 'cloudcannon-hugo',
				version: '0.0.1'
			},
			collections_config: {
				data: {
					path: 'data',
					output: false
				}
			},
			collections: {},
			data: undefined
		};

		const hugoConfig = { baseURL: '/', ...cloudcannon };
		const result = await getInfo(hugoConfig, { version: '0.0.1' });

		expect({ ...result, ...untested }).to.deep.equal({ ...expected, ...untested });
	});

	describe('with data', function () {
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
