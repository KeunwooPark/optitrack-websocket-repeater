import * as YAML from "yaml";
import * as fs from "fs";

const file = fs.readFileSync('./settings.yml', 'utf8');
const settings = YAML.parse(file);
export default settings;