export const markdownMeta = {
	markdown: 'goldmark',
	asciidocext: {
		attributes: {},
		backend: 'html5',
		extensions: [],
		failureLevel: 'fatal',
		noHeaderOrFooter: true,
		preserveTOC: false,
		safeMode: 'unsafe',
		sectionNumbers: false,
		trace: false,
		verbose: false,
		workingFolderCurrent: false
	},
	blackfriday: {
		angledQuotes: false,
		extensions: null,
		extensionsMask: null,
		footnoteAnchorPrefix: '',
		footnoteReturnLinkContents: '',
		fractions: true,
		hrefTargetBlank: false,
		latexDashes: true,
		nofollowLinks: false,
		noreferrerLinks: false,
		plainIDAnchors: true,
		skipHTML: false,
		smartDashes: true,
		smartypants: true,
		smartypantsQuotesNBSP: false,
		taskLists: true
	},
	goldmark: {
		extensions: {
			definitionList: true,
			footnote: true,
			linkify: true,
			strikethrough: true,
			table: true,
			taskList: true,
			typographer: true
		},
		parser: {
			attribute: true,
			autoHeadingID: true,
			autoHeadingIDType: 'github'
		},
		renderer: {
			hardWraps: false,
			unsafe: false,
			xhtml: false
		}
	},
	highlight: {
		anchorLineNos: false,
		codeFences: true,
		guessSyntax: false,
		hl_Lines: '',
		lineAnchors: '',
		lineNoStart: 1,
		lineNos: false,
		lineNumbersInTable: true,
		noClasses: true,
		style: 'monokai',
		tabWidth: 4
	},
	tableofcontents: {
		endLevel: 3,
		ordered: false,
		startLevel: 2
	}
};
