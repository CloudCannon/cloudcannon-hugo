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
		'layouts/mytype/single.html',
		'layouts/posts/mylayout.html',
		'layouts/posts/single.html'
	],
	otherPages: [
		'config.yaml',
		'extraconfig.json',
		'theme/exampleSite/index.html']
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
