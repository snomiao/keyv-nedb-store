# keyv-nedb-store

A [Keyv](https://github.com/jaredwray/keyv) store implementation using [NeDB](https://github.com/seald/nedb) ([@seald-io/nedb](https://www.npmjs.com/package/@seald-io/nedb)) as the backend storage.

## Features

- **File-based storage** - Persistent key-value storage using NeDB's file system backend
- **YAML-friendly** - NeDB files are human-readable and linter-friendly
- **Namespace support** - Organize your data with namespaces
- **TTL support** - Set time-to-live for automatic key expiration
- **Custom serialization** - Optional JSON serialization for complex data types
- **TypeScript** - Fully typed with TypeScript support

## Installation

```bash
bun install keyv-nedb-store @seald-io/nedb
```

Or with npm:

```bash
npm install keyv-nedb-store @seald-io/nedb
```

## Usage

### Basic Example

```ts
import Keyv from "keyv";
import { KeyvNedbStore } from "keyv-nedb-store";

// Create a store with file-based persistence
const store = new KeyvNedbStore(".cache/database.nedb.yaml");

const keyv = new Keyv({ store });

// Set a value
await keyv.set("foo", "bar");

// Get a value
const value = await keyv.get("foo"); // "bar"

// Delete a value
await keyv.delete("foo");

// Clear all values
await keyv.clear();
```

### With Namespace

```ts
const store = new KeyvNedbStore({
  filename: "database.nedb.yaml",
  namespace: "myapp",
  autoload: true
});

const keyv = new Keyv({ store });

await keyv.set("user:1", { name: "Alice" });
// Stored with key: "myapp:user:1"
```

### With TTL (Time-To-Live)

```ts
const keyv = new Keyv({ store });

// Set a value that expires in 1 second
await keyv.set("temp", "value", 1000);

// Wait for expiration
await new Promise(resolve => setTimeout(resolve, 1100));

const value = await keyv.get("temp"); // undefined
```

### With Custom Serialization

```ts
const store = new KeyvNedbStore({
  filename: "database.nedb.yaml",
  serializer: {
    stringify: JSON.stringify,
    parse: JSON.parse
  },
  autoload: true
});

const keyv = new Keyv({ store });

// Store complex objects
await keyv.set("user", { id: 1, name: "Alice", roles: ["admin", "user"] });
```

## API

### `new KeyvNedbStore(options)`

Creates a new NeDB store instance.

#### Options

All [NeDB DataStoreOptions](https://github.com/seald/nedb#creatingloading-a-database) are supported, plus:

- `namespace` (string, optional) - Prefix for all keys
- `serializer` (object, optional) - Custom serialization for values
  - `stringify` (function) - Serialize value to string
  - `parse` (function) - Deserialize string to value

Common NeDB options:

- `filename` (string) - Path to the database file
- `autoload` (boolean) - Automatically load the database
- `inMemoryOnly` (boolean) - Use in-memory only (no persistence)

### Store Methods

Implements the [Keyv Store Adapter](https://github.com/jaredwray/keyv#store-adapters) interface:

- `get(key)` - Get a value by key
- `set(key, value, ttl?)` - Set a value with optional TTL in milliseconds
- `delete(key)` - Delete a value by key
- `clear()` - Clear all values (respects namespace)

## Why NeDB?

NeDB is a lightweight, embedded database that:

- Requires no separate database server
- Stores data in human-readable files
- Works great with YAML linters
- Provides a MongoDB-like API
- Supports indexing and complex queries

Perfect for:

- Configuration storage
- Cache storage
- Small to medium datasets
- Serverless environments
- Development and testing

## Development

Built with [Bun](https://bun.com):

```bash
# Install dependencies
bun install

# Format code
bun run fmt

# Build
bun run build
```

## License

MIT

## Related

- [Keyv](https://github.com/jaredwray/keyv) - Simple key-value storage with support for multiple backends
- [NeDB](https://github.com/seald/nedb) - Embedded persistent database for Node.js
