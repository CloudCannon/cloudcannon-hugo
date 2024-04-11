import { expect } from 'chai';
import mock from 'mock-fs';
import { testFileStructure, configFiles, configOrder } from '../test-paths.js';
import {
	configSort,
	getConfigPaths,
	getConfigContents,
	getHugoConfig
} from '../../src/helpers/hugo-config.js';

describe('hugo-config', function () {
	describe('configSort', function () {
		it('should sort based on extension name', function () {
			const testArray = ['config.toml', 'a.json', 'b.toml', 'c.yaml'];
			const sorted = configSort(testArray);
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
					'hugo.toml'
				];

				const configPaths = await getConfigPaths();
				expect(configPaths).to.deep.equal(expected);
			});

			it('should get all configPaths with specified config file', async function () {
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

				const configPaths = await getConfigPaths({ config: 'extraconfig.json' });
				expect(configPaths).to.deep.equal(expected);
			});
			after(function () {
				mock.restore();
			});
		});
		context('hugo.toml and config.toml files', function () {
			before(function () {
				mock({ 'config.toml': '', 'hugo.toml': '' });
			});
			it('should get just hugo.toml', async function () {
				const configPaths = await getConfigPaths();
				expect(configPaths).to.deep.equal(['hugo.toml']);
			});
			after(function () {
				mock.restore();
			});
		});
		context('hugo.json and config.toml files', function () {
			before(function () {
				mock({ 'config.toml': '', 'hugo.json': '' });
			});
			it('should get just hugo.json', async function () {
				const configPaths = await getConfigPaths();
				expect(configPaths).to.deep.equal(['hugo.json']);
			});
			after(function () {
				mock.restore();
			});
		});
		context('hugo.yaml and config.json files', function () {
			before(function () {
				mock({ 'config.json': '', 'hugo.yaml': '' });
			});
			it('should get just hugo.yaml', async function () {
				const configPaths = await getConfigPaths();
				expect(configPaths).to.deep.equal(['hugo.yaml']);
			});
			after(function () {
				mock.restore();
			});
		});
		context('hugo.toml and config.toml files with specified config file', function () {
			before(function () {
				mock({ 'config.toml': '', 'hugo.toml': '' });
			});
			it('should get just specified file', async function () {
				const configPaths = await getConfigPaths({ config: 'wildconfigfile.json' });
				expect(configPaths).to.deep.equal(['wildconfigfile.json']);
			});
			after(function () {
				mock.restore();
			});
		});
		context('yaml and json config file', function () {
			before(function () {
				mock({ 'hugo.yaml': '', 'hugo.json': '' });
			});
			it('should get just hugo.yaml', async function () {
				const configPaths = await getConfigPaths();
				expect(configPaths).to.deep.equal(['hugo.yaml']);
			});
			after(function () {
				mock.restore();
			});
		});
		context('json config file', function () {
			before(function () {
				mock({ 'hugo.json': '' });
			});
			it('should get all configPaths', async function () {
				const configPaths = await getConfigPaths();
				expect(configPaths).to.deep.equal(['hugo.json']);
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
				const configPaths = await getConfigPaths();
				expect(configPaths).to.deep.equal([]);
			});
			after(function () {
				mock.restore();
			});
		});
		context('Config files within a source directory', function () {
			before(function () {
				mock({ 'src/dir': { 'hugo.toml': '' } });
			});
			it('should get all configPaths', async function () {
				const configPaths = await getConfigPaths({ source: 'src/dir' });
				expect(configPaths).to.deep.equal(['src/dir/hugo.toml']);
			});
			after(function () {
				mock.restore();
			});
		});
		context('Config files within a source directory and config directory', function () {
			before(function () {
				mock({ 'src/dir/config/_default': { 'hugo.toml': '' } });
			});
			it('should get all configPaths', async function () {
				const configPaths = await getConfigPaths({ source: 'src/dir', configDir: 'config' });
				expect(configPaths).to.deep.equal(['src/dir/config/_default/hugo.toml']);
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
			const result = await getConfigContents([]);
			expect(result).to.deep.equal([]);
		});

		it('should return array of items', async function () {
			const expected = [
				{
					params: {
						prio1: 'actualconfig',
						prio2: 'actualconfig',
						prio3: 'actualconfig',
						prio4: 'actualconfig',
						prio5: 'actualconfig',
						prio6: 'actualconfig',
						prio7: 'actualconfig',
						prio8: 'actualconfig',
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
			const result = await getConfigContents(configOrder, 'actualconfig.toml,directory/moreconfig.json');
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
						prio7: 'moreconfig',
						prio8: 'actualconfig'
					}
				};

				const flags = { config: 'actualconfig.toml,directory/moreconfig.json,config.toml' };
				const obj = await getHugoConfig(flags);
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

				const flags = { baseURL: 'http://build-arg.org/' };
				const obj = await getHugoConfig(flags);
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

				const flags = { contentDir: 'buildArgContentDir' };
				const obj = await getHugoConfig(flags);
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

				const flags = { layoutDir: 'buildArgLayoutDir' };
				const obj = await getHugoConfig(flags);
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

				const flags = { source: 'sourceDir' };
				const obj = await getHugoConfig(flags);
				expect(obj).to.deep.equal(expected);
			});
		});

		context('destination supplied as buildArg', function () {
			it('should return destination', async function () {
				const expected = {
					destination: 'destinationDir',
					baseURL: '/'
				};

				const flags = { destination: 'destinationDir' };
				const obj = await getHugoConfig(flags);
				expect(obj).to.deep.equal(expected);
			});
		});

		context('configDir supplied as buildArg', function () {
			it('should return configDir', async function () {
				const expected = {
					configDir: 'configDir',
					baseURL: '/'
				};

				const flags = { configDir: 'configDir' };
				const obj = await getHugoConfig(flags);
				expect(obj).to.deep.equal(expected);
			});
		});

		it('should return object with only baseurl', async function () {
			const expected = {
				baseURL: '/'
			};

			const obj = await getHugoConfig();
			expect(obj).to.deep.equal(expected);
		});
	});
});
