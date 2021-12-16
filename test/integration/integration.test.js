import { spawnSync } from 'child_process';
import { relative } from 'path';
import { unlink, readFile } from 'fs/promises';
import chai from 'chai';
import deepEqualInAnyOrder from 'deep-equal-in-any-order';

chai.use(deepEqualInAnyOrder);
const { expect } = chai;

const CHECKED_KEYS = [ // Skips time and generator
	'version',
	'cloudcannon',
	'paths',
	'data_config',
	'collections_config',
	'collection_groups',
	'collections',
	'data',
	'source',
	'timezone',
	'base_url',
	'_inputs',
	'_editables',
	'_select_data',
	'_structures',
	'editor',
	'source_editor'
];

describe('integration should generate info.json', function () {
	this.timeout(5000); // sometimes takes longer than 2000ms (default)

	it('with legacy config', async function () {
		const expectedRaw = await readFile('test/integration/legacy.json');
		const expected = JSON.parse(expectedRaw);

		const pathToPackage = relative('legacy', '../..');
		const wd = 'test/integration/legacy';

		try {
			await unlink('test/integration/legacy/public/_cloudcannon/info.json');
		} catch (e) {
			if (e.code !== 'ENOENT') {
				throw e;
			}
		}

		spawnSync('npx', [pathToPackage, '--config', 'cloudcannon.toml,config.toml'], {
			cwd: wd,
			stdio: 'pipe',
			encoding: 'utf-8'
		});

		const infoRaw = await readFile('test/integration/legacy/public/_cloudcannon/info.json');
		const info = JSON.parse(infoRaw);

		const expectedKeys = [
			'source',
			'base_url',
			'_comments',
			'_options',
			'editor',
			'source_editor',
			'_array_structures',
			'_select_data',
			'paths',
			'time',
			'version',
			'cloudcannon',
			'generator',
			'collections_config',
			'collections',
			'data',
			'data_config'
		];

		expect(Object.keys(info)).to.deep.equalInAnyOrder(expectedKeys);

		CHECKED_KEYS.forEach(function (key) {
			expect(info[key]).to.deep.equalInAnyOrder(expected[key]);
		});
	});
});
