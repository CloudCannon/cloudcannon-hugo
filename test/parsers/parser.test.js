import assert from 'node:assert';
import { describe, it } from 'node:test';
import { parseFile, parseFrontMatter } from '../../src/parsers/parser.js';

describe('parseFile', function () {
	it('should return empty when path is empty', async function () {
		const details = await parseFile('fakePath');
		const expected = {};
		assert.deepEqual(details, expected);
	});
});

describe('parser.js', function () {
	describe('parseFrontMatter', function () {
		const tests = [
			{
				context: 'empty file',
				input: '',
				expected: {}
			},
			{
				context: 'file with small valid yaml frontmatter',
				input: '---\nkey: value\n---\n',
				expected: {
					key: 'value'
				}
			},
			{
				context: 'file with small invalid yaml frontmatter',
				input: '---\n,\n---\n',
				expected: undefined
			},
			{
				context: 'file with small valid yaml frontmatter but invalid fences',
				input: '--\nkey: value\n---\n',
				expected: {}
			},
			{
				context: 'file with small valid toml frontmatter',
				input: '+++\nkey = "value"\n+++\n',
				expected: {
					key: 'value'
				}
			},
			{
				context: 'file with small invalid toml frontmatter',
				input: '+++\nkey: "value"\n+++\n',
				expected: undefined
			},
			{
				context: 'file with small valid toml frontmatter but invalid fences',
				input: '++\nkey: "value"\n+++\n',
				expected: {}
			},
			{
				context: 'file with small valid json frontmatter',
				input: '{\n"key" = "value"\n}\n',
				expected: {}
			},
			{
				context: 'file with no frontmatter',
				input: 'This is some cool content!',
				expected: {}
			}
		];

		tests.forEach((test) => {
			it(test.context || '', function () {
				const result = parseFrontMatter(test.input);
				assert.deepEqual(result, test.expected);
			});
		});
	});
});
