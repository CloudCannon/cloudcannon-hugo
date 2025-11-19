import yaml from "js-yaml";
import log from "../helpers/logger.js";

export function parseYaml(data) {
	try {
		return yaml.load(data, { json: true });
	} catch (parseError) {
		log(parseError, "error");
	}
}
