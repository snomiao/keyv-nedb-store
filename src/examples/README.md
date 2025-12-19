# keyv-nedb-store Examples

This directory contains practical examples demonstrating various features and use cases of `keyv-nedb-store`.

## Running Examples

All examples can be run using Bun:

```bash
bun src/examples/<example-name>.ts
```

For example:

```bash
bun src/examples/basic.ts
```

## Available Examples

### 1. Basic Usage (`basic.ts`)

Learn the fundamentals:
- Creating a file-based store
- Basic CRUD operations (Create, Read, Update, Delete)
- Clearing all data

```bash
bun src/examples/basic.ts
```

### 2. TTL - Time To Live (`ttl.ts`)

Explore automatic expiration:
- Setting values with expiration times
- Different TTL durations
- Automatic cleanup of expired values

```bash
bun src/examples/ttl.ts
```

### 3. Namespaces (`namespace.ts`)

Organize your data:
- Using namespaces to isolate data
- Multiple namespaces in the same file
- Namespace-specific operations

```bash
bun src/examples/namespace.ts
```

### 4. Complex Objects (`complex-objects.ts`)

Work with rich data structures:
- Storing nested objects and arrays
- Handling special characters in keys (dots, dollar signs)
- Various data types (strings, numbers, booleans, null)

```bash
bun src/examples/complex-objects.ts
```

### 5. Caching (`cache.ts`)

Implement cache patterns:
- Cache-aside pattern
- Managing cache invalidation
- TTL-based expiration
- Performance benefits

```bash
bun src/examples/cache.ts
```

### 6. Custom Serializers (`custom-serializer.ts`)

Advanced serialization:
- Custom Date object handling
- Key escaping for special characters
- Raw value storage
- Custom data transformations

```bash
bun src/examples/custom-serializer.ts
```

### 7. In-Memory Store (`in-memory.ts`)

Temporary storage without persistence:
- In-memory only mode
- Fast storage for temporary data
- Testing scenarios
- Session storage

```bash
bun src/examples/in-memory.ts
```

### 8. Iterator (`iterator.ts`)

Iterate over all entries in the store:
- Using for-await-of loops
- Namespace-specific iteration
- Automatic filtering of expired values
- Collecting entries into arrays/objects
- Counting entries

```bash
bun src/examples/iterator.ts
```

## Example Structure

Each example follows this pattern:

1. **Header comment** - Describes what the example demonstrates
2. **Imports** - Required dependencies
3. **Main function** - Step-by-step demonstration with console output
4. **Cleanup** - Removes temporary data

## Generated Files

Examples that use file-based persistence will create files in the `.cache/` directory:

- `basic-example.nedb.yaml`
- `ttl-example.nedb.yaml`
- `namespace-example.nedb.yaml`
- `complex-example.nedb.yaml`
- `cache-example.nedb.yaml`
- `serializer-example.nedb.yaml`
- etc.

These files are human-readable and can be inspected to see how data is stored.

## Clean Up

To remove all example cache files:

```bash
rm -rf .cache
```

## Tips

- Run examples one at a time to see their output clearly
- Inspect the generated `.nedb.yaml` files to understand the storage format
- Modify examples to experiment with different configurations
- Use in-memory mode for testing to avoid creating files

## Next Steps

After exploring these examples:

1. Read the [main README](../../README.md) for API documentation
2. Check out the [tests](../index.spec.ts) for more usage patterns
3. Build your own application using `keyv-nedb-store`

## Contributing

Have an idea for a new example? Feel free to contribute! Examples should:

- Be self-contained and runnable
- Include clear comments explaining each step
- Clean up after themselves
- Focus on a specific feature or use case
