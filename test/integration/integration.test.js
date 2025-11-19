import assert from 'node:assert';
import { describe, it } from 'node:test';
import { spawnSync } from 'child_process';
import { relative, join } from 'path';
import { unlink, readFile } from 'fs/promises';

// Helper function to sort objects and arrays for comparison
function sortForComparison(obj) {
	if (Array.isArray(obj)) {
		return obj.map(sortForComparison).sort((a, b) => {
			const aStr = JSON.stringify(a);
			const bStr = JSON.stringify(b);
			return aStr.localeCompare(bStr);
		});
	}
	if (obj !== null && typeof obj === 'object') {
		const sorted = {};
		Object.keys(obj)
			.sort()
			.forEach((key) => {
				sorted[key] = sortForComparison(obj[key]);
			});
		return sorted;
	}
	return obj;
}

// Helper function to assert deep equality in any order
function assertDeepEqualInAnyOrder(actual, expected, message) {
	const sortedActual = sortForComparison(actual);
	const sortedExpected = sortForComparison(expected);
	assert.deepEqual(sortedActual, sortedExpected, message);
}

const CHECKED_KEYS = [
	// Skips 'time'
	'version',
	'generator',
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
	'source_editor',
];

async function run(fixture, npxArgs = [], expectedOutputFile) {
	const expectedPath = join(
		'test/integration',
		expectedOutputFile || `${fixture}.json`,
	);
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
		encoding: 'utf-8',
	});

	const infoRaw = await readFile(infoPath);
	const info = JSON.parse(infoRaw);

	const expectedKeys = Object.keys(expected);
	assertDeepEqualInAnyOrder(Object.keys(info), expectedKeys);

	CHECKED_KEYS.forEach(function (key) {
		if (expected[key] === 'UNCHECKED') {
			return;
		}

		if (key === 'generator') {
			const renderer = info.generator?.metadata?.markdown;
			assertDeepEqualInAnyOrder(
				info.generator?.metadata?.[renderer],
				expected.generator?.metadata?.[renderer],
			);
		} else {
			assertDeepEqualInAnyOrder(info[key], expected[key]);
		}
	});
}

describe(
	'integration should generate info.json',
	{ timeout: 10000 },
	function () {
		// sometimes takes longer than 2000ms (default)

		it('with YAML config file', async function () {
			await run('yaml-config');
		});

		it('with YAML config file and specified environment', async function () {
			await run(
				'yaml-config',
				['--environment', 'staging'],
				'yaml-config-staging.json',
			);
		});

		it('with collections_config_override', async function () {
			await run('collections-config-override');
		});

		it('with multilingual pages', async function () {
			await run('multilingual');
		});

		it('with legacy config', async function () {
			await run('legacy', ['--config', 'cloudcannon.toml,config.toml']);
		});
	},
);
