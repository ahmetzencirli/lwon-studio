const fs = require('fs');

const html = fs.readFileSync('c:/Users/ahmet/Documents/lwon-studio/index.html', 'utf-8');
const match = html.match(/function extractSchema\([\s\S]*?\n        \}/);

let extractSchemaCode = match[0];
// Need to execute extractSchema in this scope
eval(extractSchemaCode);

const data = [{
  "page": {
    "title": "Tittle 1",
    "blocks": [
      {
        "content": "123",
        "blocks": [
          {
            "content": "111",
            "blocks": []
          },
          {
            "content": "222",
            "blocks": [
              {
                "content": "66",
                "blocks": []
              }
            ]
          }
        ]
      },
      {
        "content": "456",
        "blocks": []
      }
    ]
  }
}];

const schema = extractSchema(data);
console.log(JSON.stringify(schema, null, 2));

const match2 = html.match(/function schemaToString\([\s\S]*?\n        \}/);
eval(match2[0]);
console.log("SCHEMA STR:", schemaToString(schema));

const match3 = html.match(/function dataToString\([\s\S]*?\n        \}/);
eval(match3[0]);
console.log("DATA STR:", dataToString(data, schema));

