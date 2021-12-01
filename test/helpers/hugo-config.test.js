const { expect } = require('chai');
const mock = require('mock-fs');
const hugoHelper = require('../../src/helpers/hugo-config');
const {
	testFileStructure, configFiles, configOrder
} = require('../test-paths');

describe('hugo-config', function () {
	describe('configSort', function () {
		it('should sort based on extension name', function () {
			const testArray = ['config.toml', 'a.json', 'b.toml', 'c.yaml'];
			const sorted = hugoHelper._configSort(testArray);
			expect(sorted).to.deep.equal(['b.toml', 'c.yaml', 'a.json', 'config.toml']);
		});
	});

	describe('getConfigPaths', function () {
		context('"Standard" file structure', function () {
			before(function () {
				mock(testFileStructure);
			});
			it('should get all configPaths', async function () {
				const expected = [
					'config/production/params.toml',
					'config/production/config.toml',
					'config/_default/languages.toml',
					'config/_default/menus.en.toml',
					'config/_default/menus.zh.toml',
					'config/_default/params.toml',
					'config/_default/config.toml',
					'extraconfig.json'
				];

				const configPaths = await hugoHelper.getConfigPaths({ config: 'extraconfig.json' });
				expect(configPaths).to.deep.equal(expected);
			});
			after(function () {
				mock.restore();
			});
		});
		context('yaml and json config file', function () {
			before(function () {
				mock({ 'config.yaml': '', 'config.json': '' });
			});
			it('should get just config.yaml', async function () {
				const configPaths = await hugoHelper.getConfigPaths();
				expect(configPaths).to.deep.equal(['config.yaml']);
			});
			after(function () {
				mock.restore();
			});
		});
		context('json config file', function () {
			before(function () {
				mock({ 'config.json': '' });
			});
			it('should get all configPaths', async function () {
				const configPaths = await hugoHelper.getConfigPaths();
				expect(configPaths).to.deep.equal(['config.json']);
			});
			after(function () {
				mock.restore();
			});
		});
		context('no config files', function () {
			before(function () {
				mock({ 'notconfig.md': '' });
			});
			it('should get all configPaths', async function () {
				const configPaths = await hugoHelper.getConfigPaths();
				expect(configPaths).to.deep.equal([]);
			});
			after(function () {
				mock.restore();
			});
		});
		context('Config files within a source directory', function () {
			before(function () {
				mock({ 'src/dir': { 'config.toml': '' } });
			});
			it('should get all configPaths', async function () {
				const configPaths = await hugoHelper.getConfigPaths({ source: 'src/dir' });
				expect(configPaths).to.deep.equal(['src/dir/config.toml']);
			});
			after(function () {
				mock.restore();
			});
		});
		context('Config files within a source directory and config directory', function () {
			before(function () {
				mock({ 'src/dir/config/_default': { 'config.toml': '' } });
			});
			it('should get all configPaths', async function () {
				const configPaths = await hugoHelper.getConfigPaths({ source: 'src/dir', configDir: 'config' });
				expect(configPaths).to.deep.equal(['src/dir/config/_default/config.toml']);
			});
			after(function () {
				mock.restore();
			});
		});
	});

	describe('getConfigContents', function () {
		before(function () {
			mock(configFiles);
		});

		it('should return empty array with no config files', async function () {
			const result = await hugoHelper.getConfigContents([]);
			expect(result).to.deep.equal([]);
		});

		it('should return array of items', async function () {
			const expected = [
				{
					params: {
						prio1: 'extraconfig',
						prio2: 'extraconfig',
						prio3: 'extraconfig',
						prio4: 'extraconfig',
						prio5: 'extraconfig',
						prio6: 'extraconfig',
						prio7: 'extraconfig',
						prio8: 'extraconfig',
						prio9: 'extraconfig'
					}
				},
				{
					params: {
						prio1: 'moreconfig',
						prio2: 'moreconfig',
						prio3: 'moreconfig',
						prio4: 'moreconfig',
						prio5: 'moreconfig',
						prio6: 'moreconfig',
						prio7: 'moreconfig',
						prio8: 'moreconfig'
					}
				},
				{
					params: {
						prio1: 'config',
						prio2: 'config',
						prio3: 'config',
						prio4: 'config',
						prio5: 'config',
						prio6: 'config',
						prio7: 'config'
					}
				},
				{
					baseURL: 'http://example.org/',
					params: {
						prio1: 'defaultconfig',
						prio2: 'defaultconfig',
						prio3: 'defaultconfig',
						prio4: 'defaultconfig',
						prio5: 'defaultconfig',
						prio6: 'defaultconfig'
					},
					title: 'Hugo Test Site'
				},
				{
					params: {
						prio1: 'jsondefaultparams',
						prio2: 'jsondefaultparams',
						prio3: 'jsondefaultparams',
						prio4: 'jsondefaultparams',
						prio5: 'jsondefaultparams'
					}
				},
				{
					params: {
						prio1: 'yamldefaultparams',
						prio2: 'yamldefaultparams',
						prio3: 'yamldefaultparams',
						prio4: 'yamldefaultparams'
					}
				},
				{
					params: {
						prio1: 'tomldefaultparams',
						prio2: 'tomldefaultparams',
						prio3: 'tomldefaultparams'
					}
				},
				{
					params: {
						prio1: 'prodconfig',
						prio2: 'prodconfig'
					}
				},
				{
					params: {
						prio1: 'prodparams'
					}
				}
			];
			const result = await hugoHelper.getConfigContents(configOrder, 'extraconfig.toml,directory/moreconfig.json');
			expect(result).to.deep.equal(expected);
		});

		after(function () {
			mock.restore();
		});
	});

	describe('getHugoConfig', function () {
		context('many files to merge', function () {
			before(function () {
				mock(configFiles);
			});
			it('should return the correctly merged object', async function () {
				const expected = {
					baseURL: 'http://example.org/',
					title: 'Hugo Test Site',
					params: {
						prio1: 'prodparams',
						prio2: 'prodconfig',
						prio3: 'tomldefaultparams',
						prio4: 'yamldefaultparams',
						prio5: 'jsondefaultparams',
						prio6: 'defaultconfig',
						prio7: 'config',
						prio8: 'moreconfig',
						prio9: 'extraconfig'
					}
				};

				const obj = await hugoHelper.getHugoConfig(['--config', 'extraconfig.toml,directory/moreconfig.json,config.toml']);
				expect(obj).to.deep.equal(expected);
			});
			after(function () {
				mock.restore();
			});
		});

		context('baseURL supplied in both buildArgs and config', function () {
			before(function () {
				mock({ 'config.toml': 'baseURL = "http://config.org/"' });
			});

			it('should return buildArg baseURL', async function () {
				const expected = {
					baseURL: 'http://build-arg.org/'
				};
				const obj = await hugoHelper.getHugoConfig(['--baseURL', 'http://build-arg.org/']);
				expect(obj).to.deep.equal(expected);
			});

			after(function () {
				mock.restore();
			});
		});

		context('contentDir supplied in both buildArgs and config', function () {
			before(function () {
				mock({ 'config.toml': 'contentDir = "configContentDir"' });
			});

			it('should return buildArg contentDir', async function () {
				const expected = {
					contentDir: 'buildArgContentDir',
					baseURL: '/'
				};
				const obj = await hugoHelper.getHugoConfig(['--contentDir', 'buildArgContentDir']);
				expect(obj).to.deep.equal(expected);
			});

			after(function () {
				mock.restore();
			});
		});

		context('layoutDir supplied in both buildArgs and config', function () {
			before(function () {
				mock({ 'config.toml': 'layoutDir = "configLayoutDir"' });
			});

			it('should return buildArg baseURL', async function () {
				const expected = {
					layoutDir: 'buildArgLayoutDir',
					baseURL: '/'
				};
				const obj = await hugoHelper.getHugoConfig(['--layoutDir', 'buildArgLayoutDir']);
				expect(obj).to.deep.equal(expected);
			});

			after(function () {
				mock.restore();
			});
		});

		context('source supplied as buildArg', function () {
			it('should return source', async function () {
				const expected = {
					source: 'sourceDir',
					baseURL: '/'
				};
				const obj = await hugoHelper.getHugoConfig(['--source', 'sourceDir']);
				expect(obj).to.deep.equal(expected);
			});
		});

		context('destination supplied as buildArg', function () {
			it('should return destination', async function () {
				const expected = {
					destination: 'destinationDir',
					baseURL: '/'
				};
				const obj = await hugoHelper.getHugoConfig(['--destination', 'destinationDir']);
				expect(obj).to.deep.equal(expected);
			});
		});

		context('configDir supplied as buildArg', function () {
			it('should return configDir', async function () {
				const expected = {
					configDir: 'configDir',
					baseURL: '/'
				};
				const obj = await hugoHelper.getHugoConfig(['--configDir', 'configDir']);
				expect(obj).to.deep.equal(expected);
			});
		});

		it('should return object with only baseurl', async function () {
			const expected = {
				baseURL: '/'
			};

			const obj = await hugoHelper.getHugoConfig();
			expect(obj).to.deep.equal(expected);
		});
	});
});
