import assert from "node:assert";
import { after, before, describe, it } from "node:test";
import mock from "mock-fs";
import { getInfo } from "../../src/generators/info.js";
import pathHelper from "../../src/helpers/paths.js";
import { dataFiles } from "../test-paths.js";

const EXPECTED_DATA = {
	footer: [
		{ name: "Github", order: 0 },
		{ name: "RSS", order: 1 },
	],
	nav: [
		{ name: "About", url: "/about/" },
		{ name: "Contact", url: "/contact/" },
	],
	staff_members: {
		jane: { name: "Jane Doe", title: "Developer" },
		john: { name: "John Smith", title: "Designer" },
	},
};

describe("info generator", { timeout: 10000 }, () => {
	// sometimes takes longer than 2000ms (default)

	const untested = {
		time: "UNTESTED",
		generator: "UNTESTED",
	};

	it("with no cloudcannon specific config", async () => {
		const expected = {
			source: "",
			base_url: "",
			data_config: undefined,
			_comments: undefined,
			_options: undefined,
			_inputs: undefined,
			_editables: undefined,
			collection_groups: undefined,
			editor: undefined,
			source_editor: undefined,
			_enabled_editors: undefined,
			_instance_values: undefined,
			_structures: undefined,
			_array_structures: undefined,
			_select_data: undefined,
			paths: pathHelper.getPaths(),
			version: "0.0.3",
			cloudcannon: {
				name: "cloudcannon-hugo",
				version: "0.0.0",
			},
			collections_config: {},
			collections: {},
			data: undefined,
		};

		const result = await getInfo({ baseURL: "/" });

		assert.deepStrictEqual(
			{ ...result, ...untested },
			{ ...expected, ...untested },
		);
	});

	it("with cloudcannon specific config", async () => {
		const cloudcannon = {
			_comments: { comment: "comment" },
			_options: { option: "value" },
			_inputs: {},
			_editables: {},
			editor: { default_path: "/about/" },
			source_editor: { theme: "monokai", tab_size: 2, show_gutter: false },
			_structures: {},
			_array_structures: { object: {} },
			_select_data: { object: {} },
		};

		const expected = {
			source: "",
			base_url: "",
			data_config: undefined,
			_comments: { comment: "comment" },
			_options: { option: "value" },
			_inputs: {},
			_editables: {},
			collection_groups: undefined,
			editor: { default_path: "/about/" },
			source_editor: { theme: "monokai", tab_size: 2, show_gutter: false },
			_enabled_editors: undefined,
			_instance_values: undefined,
			_structures: {},
			_array_structures: { object: {} },
			_select_data: { object: {} },
			paths: pathHelper.getPaths(),
			version: "0.0.3",
			cloudcannon: {
				name: "cloudcannon-hugo",
				version: "0.0.1",
			},
			collections_config: {},
			collections: {},
			data: undefined,
		};

		const hugoConfig = { baseURL: "/", ...cloudcannon };
		const result = await getInfo(hugoConfig, { version: "0.0.1" });

		assert.deepStrictEqual(
			{ ...result, ...untested },
			{ ...expected, ...untested },
		);
	});

	describe("with data", () => {
		before(() => {
			mock(dataFiles);
		});

		it("should return all data", async () => {
			const result = await getInfo({ cloudcannon: { data: true } });

			assert.deepEqual(result.data, EXPECTED_DATA);
		});

		it("should return the specified data", async () => {
			const expected = {
				nav: EXPECTED_DATA.nav,
				staff_members: EXPECTED_DATA.staff_members,
			};

			const result = await getInfo({
				cloudcannon: { data: { nav: true, staff_members: true } },
			});

			assert.deepEqual(result.data, expected);
		});
	});

	after(() => {
		mock.restore();
	});
});
