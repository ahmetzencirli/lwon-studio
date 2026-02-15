# LWON - Lightweight Object Notation Specification

LWON (Lightweight Object Notation) is a data interchange format designed to minimize redundancy by separating the schema definition from the data values. It is optimized for transmitting arrays of objects that share the same structure.

## 1. Document Structure

An LWON document consists of two sequential parts:
1.  **Schema Definition**
2.  **Data Body**

The parts are separated by whitespace.

## 2. Schema Definition

The schema defines the structure of the data records. It is a space-separated list of field definitions.

### Field Types

*   **Simple Field:** A field name representing a primitive value (string, number, boolean, empty).
    *   Syntax: `fieldName`
    *   Example: `name` `age`

*   **Simple Array:** A field representing a list of primitive values (strings, numbers, etc.).
    *   Syntax: `[fieldName]`
    *   Example: `[tags]`

*   **Nested Object:** A field representing a single nested object.
    *   Syntax: `fieldName[sub_schema]`
    *   Example: `company[name location[city]]`
    *   Interpretation: The `company` field is an object containing `name` and `location`.

*   **Array of Objects:** A field representing a list of objects with a specific schema.
    *   Syntax: `[fieldName[sub_schema]]`
    *   Example: `[address[title city]]`
    *   Interpretation: The `address` field is an array of objects, each having `title` and `city`.

## 3. Data Body

The data body contains the actual values corresponding to the schema.

*   The body is enclosed in square brackets `[ ... ]`.
*   Inside the body is a list of records (arrays), each representing one main object.
*   **Strings:** ` "double quoted" `
*   **Numbers:** ` 123 ` or ` 45.67 `
*   **Booleans:** ` true ` or ` false `
*   **Empty / Null:** ` {} ` (Used for null primitives, empty objects, and empty/null arrays).
*   **Dates:** Treated as strings. Recommended format is ISO 8601 (e.g., `"2025-08-18T11:45:00+03:00"` or `"1993-06-21"`).
*   **Objects:** Represented as an array of values `[...]` matching the nested schema order. Empty/Null objects are `{}`.
*   **Simple Arrays (Primitives):** Arrays containing only primitive values are represented as a single array of values `["val1" "val2"]`. Empty/null simple arrays are `{}`.
*   **Arrays of Objects:** Represented as a list of arrays `[ [...] [...] ]`. Empty/Null arrays are `{}`.

## Example

**Schema:**
```
name age [address[title city]] company[name] [tags]
```

**Data:**
```
[
  [ "Emre" 32 [ ["Home" "Istanbul"] ] ["TechCorp"] ["tag1" "tag2"] ]
  [ "Ahmet" 56 {} {} {} ]
]
```

**Equivalent JSON:**
```json
[
  {
    "name": "Emre",
    "age": 32,
    "address": [ { "title": "Home", "city": "Istanbul" } ],
    "company": { "name": "TechCorp" },
    "tags": ["tag1", "tag2"]
  },
  {
    "name": "Ahmet",
    "age": 56,
    "address": [],
    "company": null,
    "tags": null
  }
]
```
