const fs = require('fs');
const html = fs.readFileSync('c:/Users/ahmet/Documents/lwon-studio/index.html', 'utf-8');

const tokenizeMatch = html.match(/function tokenize\([\s\S]*?\n        \}/);
const parseSplitMatch = html.match(/function parseSplit\([\s\S]*?\n        \}/);
const parseSchemaMatch = html.match(/function parseSchema\([\s\S]*?\n        \}/);
const parseDataValueMatch = html.match(/function parseDataValue\([\s\S]*?\n        \}/);
const mapRowMatch = html.match(/function mapRow\([\s\S]*?\n        \}/);

eval(tokenizeMatch[0]);
eval(parseSplitMatch[0]);
eval(parseSchemaMatch[0]);
eval(parseDataValueMatch[0]);
eval(mapRowMatch[0]);

const input = `page[title [blocks[content [@blocks]]]]

[
  [ [ "Tittle 1" [ [ "123" [ [ "111" {} ] [ "222" [ [ "66" {} ] ] ] ] ] [ "456" {} ] ] ] ]
]`;

const tokens = tokenize(input);
const { schemaTokens, dataTokens } = parseSplit(tokens);
const schema = parseSchema(schemaTokens);
console.log("SCHEMA:", JSON.stringify(schema, null, 2));

const rawData = parseDataValue(dataTokens, { i: 0 });
console.log("RAW DATA:", JSON.stringify(rawData, null, 2));

const result = rawData.map(row => mapRow(row, schema));
console.log("RESULT JSON:", JSON.stringify(result, null, 2));
