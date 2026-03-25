# sample-data/

JSON seed fixture files used by the seed scripts in `scripts/`.

## Files

### `persons.json`

Array of person objects used to populate the `PERSON` table. Each object matches the `Person` model shape:

```json
[
  { "name": "Alice", "age": 30, "height": 165.5 },
  { "name": "Bob",   "age": 25, "height": null   }
]
```

Fields:
- `name` — string, required.
- `age` — integer or `null`.
- `height` — decimal number or `null`.

This file is read by both `scripts/seedPersons.js` (additive insert) and `scripts/seedPersonsReset.js` (clear + insert).
