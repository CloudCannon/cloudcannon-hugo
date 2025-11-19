import assert from "node:assert";
import { describe, it } from "node:test";
import { parseYaml } from "../../src/parsers/yaml.js";

describe("yaml.js", () => {
	describe("parseYaml", () => {
		it("should parse correctly", () => {
			const yamlString = "key: value";
			const parsedObject = parseYaml(yamlString);
			const expectedObject = {
				key: "value",
			};
			assert.deepEqual(parsedObject, expectedObject);
		});

		it("should not parse", () => {
			const badYamlString = ",";
			const parsedObject = parseYaml(badYamlString);
			assert.deepStrictEqual(parsedObject, undefined);
		});
	});
});
