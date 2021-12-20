import { spawnSync } from 'child_process';
import { relative, join } from 'path';
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

async function run(fixture, npxArgs = []) {
	const expectedPath = join('test/integration', `${fixture}.json`);
	const expectedRaw = await readFile(expectedPath);
	const expected = JSON.parse(expectedRaw);

	const wd = join('test/integration', fixture);
	const infoPath = join(wd, 'public/_cloudcannon/info.json');

	try {
		await unlink(infoPath);
	} catch (e) {
		if (e.code !== 'ENOENT') {
			throw e;
		}
	}

	spawnSync('npx', [relative(fixture, '../..'), ...npxArgs], {
		cwd: wd,
		stdio: [process.stdin, process.stdout, process.stderr],
		encoding: 'utf-8'
	});

	const infoRaw = await readFile(infoPath);
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
}

describe('integration should generate info.json', function () {
	this.timeout(5000); // sometimes takes longer than 2000ms (default)

	it('with YAML config file', async function () {
		await run('yaml-config');
	});

	it('with legacy config', async function () {
		await run('legacy', ['--config', 'cloudcannon.toml,config.toml']);
	});
});
