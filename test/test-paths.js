export const pathsByType = {
	collectionPaths: [
		'content/_index.md',
		'content/about.md',
		'content/about/index.md',
		'content/authors/jane-doe.md',
		'content/authors/john-smith.md',
		'content/collectionName/_index.md',
		'content/posts/_index.md',
		'content/posts/firstPost.md'
	],
	configPaths: [
		'config/_default/languages.toml',
		'config/_default/menus.en.toml',
		'config/_default/menus.zh.toml',
		'config/_default/params.toml',
		'config/_default/config.toml',
		'config.toml',
		'hugo.toml'
	],
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
		"prio7": "moreconfig"
	}
}`
	},
	'actualconfig.toml':
`[params]
prio1 = "actualconfig"
prio2 = "actualconfig"
prio3 = "actualconfig"
prio4 = "actualconfig"
prio5 = "actualconfig"
prio6 = "actualconfig"
prio7 = "actualconfig"
prio8 = "actualconfig"
`,
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
	'actualconfig.toml',
	'directory/moreconfig.json',
	'config/_default/config.toml',
	'config/_default/params.json',
	'config/_default/params.yaml',
	'config/_default/params.toml',
	'config/production/config.toml',
	'config/production/params.toml'
];

export const collectionFiles = {
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

export const testFileStructure = Object.keys(pathsByType).reduce((memo, pathType) => {
	pathsByType[pathType].forEach((path) => {
		if (!memo[path]) {
			memo[path] = 'file contents';
		}
	});

	return memo;
}, {});

export default {
	pathsByType,
	testFileStructure, // in a structure that is readable to mock-fs
	configFiles,
	configOrder,
	collectionFiles,
	dataFiles
};
