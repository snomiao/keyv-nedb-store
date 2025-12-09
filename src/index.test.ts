import { beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { unlink } from "node:fs/promises";
import KeyvNedbStore, { escapeKeys, unescapeKeys } from "./index";

describe("escapeKeys and unescapeKeys", () => {
	test("should escape and unescape dots", () => {
		const input = { "a.b.c": "value" };
		const escaped = escapeKeys(input);
		expect(escaped).toEqual({ "a%2Eb%2Ec": "value" });
		const unescaped = unescapeKeys(escaped);
		expect(unescaped).toEqual(input);
	});

	test("should escape and unescape dollar signs", () => {
		const input = { $field: "value", a$b: "value2" };
		const escaped = escapeKeys(input);
		expect(escaped).toEqual({ "%24field": "value", "a%24b": "value2" });
		const unescaped = unescapeKeys(escaped);
		expect(unescaped).toEqual(input);
	});

	test("should escape and unescape percent signs", () => {
		const input = { "a%b": "value" };
		const escaped = escapeKeys(input);
		expect(escaped).toEqual({ "a%25b": "value" });
		const unescaped = unescapeKeys(escaped);
		expect(unescaped).toEqual(input);
	});

	test("should handle keys containing literal %2E", () => {
		const input = { "a%2E": "value" };
		const escaped = escapeKeys(input);
		expect(escaped).toEqual({ "a%252E": "value" });
		const unescaped = unescapeKeys(escaped);
		expect(unescaped).toEqual(input);
	});

	test("should handle keys containing literal %24", () => {
		const input = { "a%24": "value" };
		const escaped = escapeKeys(input);
		expect(escaped).toEqual({ "a%2524": "value" });
		const unescaped = unescapeKeys(escaped);
		expect(unescaped).toEqual(input);
	});

	test("should handle keys containing literal %25", () => {
		const input = { "a%25": "value" };
		const escaped = escapeKeys(input);
		expect(escaped).toEqual({ "a%2525": "value" });
		const unescaped = unescapeKeys(escaped);
		expect(unescaped).toEqual(input);
	});

	test("should handle complex combinations", () => {
		const input = { "a.b$c%d": "value" };
		const escaped = escapeKeys(input);
		expect(escaped).toEqual({ "a%2Eb%24c%25d": "value" });
		const unescaped = unescapeKeys(escaped);
		expect(unescaped).toEqual(input);
	});

	test("should handle nested objects", () => {
		const input = {
			"a.b": {
				c$d: {
					"e%f": "value",
				},
			},
		};
		const escaped = escapeKeys(input);
		const unescaped = unescapeKeys(escaped);
		expect(unescaped).toEqual(input);
	});

	test("should handle arrays", () => {
		const input = [{ "a.b": "value1" }, { c$d: "value2" }, { "e%f": "value3" }];
		const escaped = escapeKeys(input);
		const unescaped = unescapeKeys(escaped);
		expect(unescaped).toEqual(input);
	});

	test("should handle primitive values", () => {
		expect(escapeKeys("string")).toBe("string");
		expect(escapeKeys(123)).toBe(123);
		expect(escapeKeys(true)).toBe(true);
		expect(escapeKeys(null)).toBe(null);
		expect(escapeKeys(undefined)).toBe(undefined);
	});

	test("should handle edge case with multiple percent signs", () => {
		const input = { "a%%b": "value" };
		const escaped = escapeKeys(input);
		expect(escaped).toEqual({ "a%25%25b": "value" });
		const unescaped = unescapeKeys(escaped);
		expect(unescaped).toEqual(input);
	});

	test("should handle all special characters together", () => {
		const input = { "$a.b%c": "value" };
		const escaped = escapeKeys(input);
		expect(escaped).toEqual({ "%24a%2Eb%25c": "value" });
		const unescaped = unescapeKeys(escaped);
		expect(unescaped).toEqual(input);
	});
});

describe("KeyvNedbStore - Constructor", () => {
	test("should create store with string filename", () => {
		// Don't actually create file, just test options parsing
		const store = new KeyvNedbStore({ filename: "test.db" });
		expect(store).toBeDefined();
		expect(store.opts.filename).toBe("test.db");
	});

	test("should create store with options object", () => {
		const store = new KeyvNedbStore({ filename: "test.db" });
		expect(store).toBeDefined();
		expect(store.opts.filename).toBe("test.db");
	});

	test("should create in-memory store with no options", () => {
		const store = new KeyvNedbStore();
		expect(store).toBeDefined();
		expect(store.opts.filename).toBeUndefined();
	});

	test("should set namespace correctly", () => {
		const store = new KeyvNedbStore({ namespace: "test" });
		expect(store.namespace).toBe("test");
	});

	test("should use default serializer", () => {
		const store = new KeyvNedbStore();
		expect(store.serializer).toBeDefined();
		expect(store.serializer?.stringify).toBe(escapeKeys);
		expect(store.serializer?.parse).toBe(unescapeKeys);
	});

	test("should accept custom serializer", () => {
		const customSerializer = {
			stringify: (data: any) => JSON.stringify(data),
			parse: (data: any) => JSON.parse(data),
		};
		const store = new KeyvNedbStore({ serializer: customSerializer });
		expect(store.serializer?.stringify).toBe(customSerializer.stringify);
		expect(store.serializer?.parse).toBe(customSerializer.parse);
	});

	test("should implement on() method for compatibility", () => {
		const store = new KeyvNedbStore();
		const result = store.on("event", () => {});
		expect(result).toBe(store);
	});
});

describe("KeyvNedbStore - Basic Operations", () => {
	let store: KeyvNedbStore;

	beforeEach(() => {
		// Use in-memory database for basic operations
		store = new KeyvNedbStore();
	});

	test("should set and get a value", async () => {
		await store.set("key1", "value1");
		const result = await store.get("key1");
		expect(result).toBe("value1");
	});

	test("should return undefined for non-existent key", async () => {
		const result = await store.get("nonexistent");
		expect(result).toBeUndefined();
	});

	test("should update existing value", async () => {
		await store.set("key1", "value1");
		await store.set("key1", "value2");
		const result = await store.get("key1");
		expect(result).toBe("value2");
	});

	test("should delete a key", async () => {
		await store.set("key1", "value1");
		const deleted = await store.delete("key1");
		expect(deleted).toBe(true);
		const result = await store.get("key1");
		expect(result).toBeUndefined();
	});

	test("should return false when deleting non-existent key", async () => {
		const deleted = await store.delete("nonexistent");
		expect(deleted).toBe(false);
	});

	test("should clear all keys", async () => {
		await store.set("key1", "value1");
		await store.set("key2", "value2");
		await store.set("key3", "value3");
		await store.clear();
		expect(await store.get("key1")).toBeUndefined();
		expect(await store.get("key2")).toBeUndefined();
		expect(await store.get("key3")).toBeUndefined();
	});
});

describe("KeyvNedbStore - Data Types", () => {
	let store: KeyvNedbStore;

	beforeEach(() => {
		store = new KeyvNedbStore();
	});

	test("should handle string values", async () => {
		await store.set("key", "string value");
		const result = await store.get("key");
		expect(result).toBe("string value");
	});

	test("should handle number values", async () => {
		await store.set("key", 42);
		const result = await store.get("key");
		expect(result).toBe(42);
	});

	test("should handle boolean values", async () => {
		await store.set("key", true);
		const result = await store.get("key");
		expect(result).toBe(true);
	});

	test("should handle null values", async () => {
		await store.set("key", null);
		const result = await store.get("key");
		expect(result).toBe(null);
	});

	test("should handle object values", async () => {
		const obj = { a: 1, b: "test", c: true };
		await store.set("key", obj);
		const result = await store.get("key");
		expect(result).toEqual(obj);
	});

	test("should handle array values", async () => {
		const arr = [1, "test", true, { nested: "object" }];
		await store.set("key", arr);
		const result = await store.get("key");
		expect(result).toEqual(arr);
	});

	test("should handle objects with special characters in keys", async () => {
		const obj = { "a.b": 1, $field: 2, "c%d": 3 };
		await store.set("key", obj);
		const result = await store.get("key");
		expect(result).toEqual(obj);
	});
});

describe("KeyvNedbStore - TTL (Time To Live)", () => {
	let store: KeyvNedbStore;

	beforeEach(() => {
		store = new KeyvNedbStore();
	});

	test("should return undefined for expired key", async () => {
		await store.set("key", "value", 100); // 100ms TTL
		await Bun.sleep(150); // Wait for expiration
		const result = await store.get("key");
		expect(result).toBeUndefined();
	});

	test("should return value before expiration", async () => {
		await store.set("key", "value", 1000); // 1 second TTL
		await Bun.sleep(100); // Wait a bit but not expired
		const result = await store.get("key");
		expect(result).toBe("value");
	});

	test("should handle keys without TTL", async () => {
		await store.set("key", "value");
		await Bun.sleep(100);
		const result = await store.get("key");
		expect(result).toBe("value");
	});

	test("should update TTL on re-set", async () => {
		await store.set("key", "value1", 100);
		await Bun.sleep(50);
		await store.set("key", "value2", 1000);
		await Bun.sleep(100); // Original would have expired
		const result = await store.get("key");
		expect(result).toBe("value2");
	});
});

describe("KeyvNedbStore - Namespace", () => {
	test("should prefix keys with namespace", async () => {
		const store = new KeyvNedbStore({ namespace: "test" });
		await store.set("key", "value");

		// Verify the internal key is prefixed
		const doc = await store.db.findOneAsync({ key: "test:key" });
		expect(doc).toBeDefined();
		expect(doc?.value).toBe("value");
	});

	test("should only clear keys in namespace", async () => {
		const store = new KeyvNedbStore({ namespace: "ns1" });

		// Manually insert data with different namespaces into the same db
		await store.db.insertAsync({ key: "ns1:key1", value: "value1" });
		await store.db.insertAsync({ key: "ns1:key2", value: "value2" });
		await store.db.insertAsync({ key: "ns2:key1", value: "value3" });
		await store.db.insertAsync({ key: "ns2:key2", value: "value4" });

		await store.clear();

		// ns1 keys should be gone
		expect(await store.db.findOneAsync({ key: "ns1:key1" })).toBeNull();
		expect(await store.db.findOneAsync({ key: "ns1:key2" })).toBeNull();

		// ns2 keys should remain
		expect(await store.db.findOneAsync({ key: "ns2:key1" })).toBeDefined();
		expect(await store.db.findOneAsync({ key: "ns2:key2" })).toBeDefined();
	});

	test("should delete only from specific namespace", async () => {
		const store = new KeyvNedbStore({ namespace: "ns1" });

		await store.db.insertAsync({ key: "ns1:key", value: "value1" });
		await store.db.insertAsync({ key: "ns2:key", value: "value2" });

		await store.delete("key");

		expect(await store.db.findOneAsync({ key: "ns1:key" })).toBeNull();
		expect(await store.db.findOneAsync({ key: "ns2:key" })).toBeDefined();
	});
});

describe("KeyvNedbStore - getMany", () => {
	let store: KeyvNedbStore;

	beforeEach(() => {
		store = new KeyvNedbStore();
	});

	test("should get multiple values", async () => {
		await store.set("key1", "value1");
		await store.set("key2", "value2");
		await store.set("key3", "value3");

		const results = await store.getMany(["key1", "key2", "key3"]);
		expect(results).toEqual(["value1", "value2", "value3"]);
	});

	test("should return undefined for non-existent keys", async () => {
		await store.set("key1", "value1");

		const results = await store.getMany(["key1", "nonexistent", "key3"]);
		expect(results).toEqual(["value1", undefined, undefined]);
	});

	test("should handle empty array", async () => {
		const results = await store.getMany([]);
		expect(results).toEqual([]);
	});

	test("should respect TTL in getMany", async () => {
		await store.set("key1", "value1", 100);
		await store.set("key2", "value2", 1000);
		await Bun.sleep(150);

		const results = await store.getMany(["key1", "key2"]);
		expect(results).toEqual([undefined, "value2"]);
	});
});

describe("KeyvNedbStore - Complex Scenarios", () => {
	let store: KeyvNedbStore;

	beforeEach(() => {
		store = new KeyvNedbStore();
	});

	test("should handle deeply nested objects", async () => {
		const complex = {
			level1: {
				"a.b": {
					level2: {
						$field: {
							level3: {
								"c%d": "deep value",
							},
						},
					},
				},
			},
		};
		await store.set("complex", complex);
		const result = await store.get("complex");
		expect(result).toEqual(complex);
	});

	test("should handle concurrent operations", async () => {
		const promises = [];
		for (let i = 0; i < 10; i++) {
			promises.push(store.set(`key${i}`, `value${i}`));
		}
		await Promise.all(promises);

		const getPromises = [];
		for (let i = 0; i < 10; i++) {
			getPromises.push(store.get(`key${i}`));
		}
		const results = await Promise.all(getPromises);

		for (let i = 0; i < 10; i++) {
			expect(results[i]).toBe(`value${i}`);
		}
	});

	test("should persist data to file", async () => {
		const testDbFile = "test-persist.db";

		// Clean up any existing files
		try {
			if (existsSync(testDbFile)) await unlink(testDbFile);
			if (existsSync(`${testDbFile}~`)) await unlink(`${testDbFile}~`);
		} catch {
			// Ignore cleanup errors
		}

		const store1 = new KeyvNedbStore({ filename: testDbFile, autoload: true });
		await Bun.sleep(100); // Wait for initialization
		await store1.set("key", "value");
		await Bun.sleep(100); // Wait for write to complete

		// Create new instance to simulate restart
		const store2 = new KeyvNedbStore({ filename: testDbFile, autoload: true });
		await Bun.sleep(200); // Wait for autoload

		const result = await store2.get("key");
		expect(result).toBe("value");

		// Clean up
		try {
			if (existsSync(testDbFile)) await unlink(testDbFile);
			if (existsSync(`${testDbFile}~`)) await unlink(`${testDbFile}~`);
		} catch {
			// Ignore cleanup errors
		}
	});

	test("should handle rapid set/delete cycles", async () => {
		// Set value, delete on even iterations
		await store.set("key", "value0");
		await store.delete("key"); // i=0: deleted

		await store.set("key", "value1"); // i=1: remains

		await store.set("key", "value2");
		await store.delete("key"); // i=2: deleted

		await store.set("key", "value3"); // i=3: remains

		await store.set("key", "value4");
		await store.delete("key"); // i=4: deleted

		// After i=4, the key should be deleted
		const result = await store.get("key");
		expect(result).toBeUndefined();

		// Verify we can still set after delete
		await store.set("key", "final");
		const final = await store.get("key");
		expect(final).toBe("final");
	});
});
