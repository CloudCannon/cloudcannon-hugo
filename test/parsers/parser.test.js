const { expect } = require('chai');
const { parseFrontMatter } = require('../../src/parsers/parser');

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
				expect(result).to.deep.equal(test.expected);
			});
		});
	});
});
