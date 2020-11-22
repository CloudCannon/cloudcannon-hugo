const pathsByType = {
	defaultPaths: [
		'archetypes/default.md',
		'archetypes/notes.md'],
	collectionPaths: [
		'archetypes/notes.md',
		'content/authors/jane-doe.md',
		'content/authors/john-smith.md',
		'content/collectionName/_index.md',
		'content/posts/_index.md',
		'content/posts/firstPost.md'],
	configPaths: [
		'config/_default/languages.toml',
		'config/_default/menus.en.toml',
		'config/_default/menus.zh.toml',
		'config/_default/params.toml',
		'config/_default/config.toml',
		'config.toml'],
	configPathsProduction: [
		'config/production/params.toml',
		'config/production/config.toml'
	],
	configPathsStaging: [
		'config/staging/config.toml',
		'config/staging/params'
	],
	dataPaths: [
		'data/info.yml'],
	pagePaths: [
		'content/about/index.md',
		'content/collectionName/_index.md',
		'content/index.md',
		'content/posts/_index.md'],
	otherPages: [
		'config.yaml',
		'extraconfig.json',
		'theme/exampleSite/index.html']
};

const configFiles = {
	directory: {
		'moreconfig.json':
`{
	"params": {
		"prio1": "moreconfig",
		"prio2": "moreconfig",
		"prio3": "moreconfig",
		"prio4": "moreconfig",
		"prio5": "moreconfig",
		"prio6": "moreconfig",
		"prio7": "moreconfig",
		"prio8": "moreconfig"
	}
}`
	},
	'config.toml':
`[params]
prio1 = "config"
prio2 = "config"
prio3 = "config"
prio4 = "config"
prio5 = "config"
prio6 = "config"
prio7 = "config"`,

	'extraconfig.toml':
`[params]
prio1 = "extraconfig"
prio2 = "extraconfig"
prio3 = "extraconfig"
prio4 = "extraconfig"
prio5 = "extraconfig"
prio6 = "extraconfig"
prio7 = "extraconfig"
prio8 = "extraconfig"
prio9 = "extraconfig"`,
	config: {
		_default: {
			'params.yaml':
`prio1: 'yamldefaultparams'
prio2: 'yamldefaultparams'
prio3: 'yamldefaultparams'
prio4: 'yamldefaultparams'`,

			'params.json':
`{
	"prio1": "jsondefaultparams",
	"prio2": "jsondefaultparams",
	"prio3": "jsondefaultparams",
	"prio4": "jsondefaultparams",
	"prio5": "jsondefaultparams"
}`,

			'params.toml':
`prio1 = "tomldefaultparams"
prio2 = "tomldefaultparams"
prio3 = "tomldefaultparams"`,

			'config.toml':
`baseURL = "http://example.org/"
title = "Hugo Test Site"

[params]
prio1 = "defaultconfig"
prio2 = "defaultconfig"
prio3 = "defaultconfig"
prio4 = "defaultconfig"
prio5 = "defaultconfig"
prio6 = "defaultconfig"`
		},
		production: {
			'params.toml':
			'prio1 = "prodparams"',
			'config.toml':
`[params]
prio1 = "prodconfig"
prio2 = "prodconfig"`
		},
		staging: {
			'params.toml': 'nice',
			'config.toml': 'nice'
		}
	}
};

const configOrder = [
	'extraconfig.toml',
	'directory/moreconfig.json',
	'config.toml',
	'config/_default/config.toml',
	'config/_default/params.json',
	'config/_default/params.yaml',
	'config/_default/params.toml',
	'config/production/config.toml',
	'config/production/params.toml'
];

const testFileStructure = {};
Object.keys(pathsByType).forEach((pathType) => {
	pathsByType[pathType].forEach((path) => {
		if (!testFileStructure[path]) {
			testFileStructure[path] = 'file contents';
		}
	});
});

module.exports = {
	pathsByType: pathsByType,
	testFileStructure: testFileStructure, // in a structure that is readable to mock-fs
	configFiles: configFiles,
	configOrder: configOrder
};