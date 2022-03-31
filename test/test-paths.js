export const pathsByType = {
	defaultPaths: [
		'archetypes/default.md',
		'archetypes/notes.md'],
	collectionPaths: [
		'archetypes/notes.md',
		'archetypes/web_pages.html',
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
		'data/footer.json',
		'data/nav.yml',
		'data/staff_members/jane.toml',
		'data/staff_members/john.toml'
	],
	pagePaths: [
		'content/_index.md',
		'content/about.md',
		'content/about/index.md',
		'content/collectionName/_index.md'
	],
	layoutPaths: [
		'layouts/_default/list.html',
		'layouts/index.html',
		'layouts/mytype/list.html',
		'layouts/mytype/mylayout.html',
		'layouts/posts/mylayout.html',
		'layouts/posts/single.html'
	],
	otherPages: [
		'config.yaml',
		'extraconfig.json',
		'theme/exampleSite/index.html']
};

export const configFiles = {
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
			'invalid.md': '',
			'params.toml': 'prio1 = "prodparams"',
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

export const configOrder = [
	'nonexistentFile.yaml',
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

export const collectionFiles = {
	archetypes: {
		leaf: {
			'index.md': ''
		},
		'default.md': '',
		'type.md': '+++\nheadless = true\n+++\n'
	},
	content: {
		coll1: {
			'_index.md': '',
			'item1.md': '---\n,\n---\n',
			'item2.md': '+++\nheadless = true\n+++\n'
		},

		posts: {
			'_index.md': 'nice',
			'post1.md': '---\ndraft: true\n---\n'
		}
	}
};

export const dataFiles = {
	data: {
		'footer.json':
`[
	{
		"name": "Github", "order": 0
	},
	{
		"name": "RSS", "order": 1
	}
]
`,
		'nav.yml':
`- name: About
  url: /about/
- name: Contact
  url: /contact/
`,
		staff_members: {
			'jane.toml':
`name = "Jane Doe"
title = "Developer"
`,
			'john.toml':
`name = "John Smith"
title = "Designer"
`
		}
	}
};

export const themeFiles = {
	'custom/themesDir': {
		t1: { 'config.toml': 'theme = ["t2/nested", "github.com/user/theme"]' },
		t2: { nested: { 'config.yaml': 'theme: t3' } },
		t3: { config: {
			customenv: { 'config.json':
`{
	"theme": ["t4", "t5"]
}`
			},
			_default: { 'config.toml': 'theme = ["t5", "t4"]' } },
		}
	}
};

export const testFileStructure = Object.keys(pathsByType).reduce((memo, pathType) => {
	pathsByType[pathType].forEach((path) => {
		if (!memo[path]) {
			memo[path] = 'file contents';
		}
	});

	return memo;
}, {});

export default {
	pathsByType: pathsByType,
	testFileStructure: testFileStructure, // in a structure that is readable to mock-fs
	configFiles: configFiles,
	configOrder: configOrder,
	collectionFiles: collectionFiles,
	dataFiles: dataFiles
};
