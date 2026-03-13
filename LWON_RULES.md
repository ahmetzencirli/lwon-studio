# LWON - Lightweight Object Notation Specification

> **Created by Ahmet Zencirli** — © 2026 Ahmet Zencirli. All rights reserved.  
> LWON is free to use for everyone. You may use, copy, modify, and distribute it freely,  
> provided that credit is given to the original author: **Ahmet Zencirli**.

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

## 5. Recursive Types (Root Self-Reference)

For recursive or self-referential structures (e.g., menus, trees), LWON supports self-reference using `@` inside `[fieldName[@]]`.

### Syntax

```
field1 field2 [subField[@]]
```

Or using a named root wrapper:

```
[menu[title link [submenu[@menu]]]]
```

*   The `@` symbol inside a recursive array definition refers back to the **entire root schema**.
*   Using `[@typeName]` inside a root wrapper `[typeName[...]]` also refers back to the root schema.
*   This is used when the data records themselves follow the recursive pattern (e.g., a list of menu items where each item can have children of the same structure).

### Rules

*   `@` represents the root field list.
*   An empty recursive array is represented as `{}` (same as all other empty arrays).

---

## Example 1 — Standard (non-recursive)

**Schema:**
```
name age [address[title city]] company[name] [tags]
```

**Data:**
```
[
  [ "John" 32 [ ["Home" "New York"] ] ["TechCorp"] ["tag1" "tag2"] ]
  [ "Alice" 56 {} {} {} ]
]
```

**Equivalent JSON:**
```json
[
  {
    "name": "John",
    "age": 32,
    "address": [ { "title": "Home", "city": "New York" } ],
    "company": { "name": "TechCorp" },
    "tags": ["tag1", "tag2"]
  },
  {
    "name": "Alice",
    "age": 56,
    "address": [],
    "company": null,
    "tags": null
  }
]
```

---

## Example 2 — Recursive (Menu Tree)

**Schema (option 1):**
```
title link [submenu[@]]
```

**Schema (option 2):**
```
[menu[title link [submenu[@menu]]]]
```

**Data:**
```
[
  ["Home" "/" {}]
  ["Products" "/products" [
    ["Electronics" "/products/electronics" [
      ["Phone" "/products/electronics/phone" {}]
    ]]
    ["Clothing" "/products/clothing" {}]
  ]]
]
```

**Equivalent JSON:**
```json
[
  { "title": "Home", "link": "/", "submenu": [] },
  {
    "title": "Products", "link": "/products",
    "submenu": [
      {
        "title": "Electronics", "link": "/products/electronics",
        "submenu": [
          { "title": "Phone", "link": "/products/electronics/phone", "submenu": [] }
        ]
      },
      { "title": "Clothing", "link": "/products/clothing", "submenu": [] }
    ]
  }
]
```

