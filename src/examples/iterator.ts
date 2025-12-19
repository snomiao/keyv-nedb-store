/**
 * Iterator example
 *
 * This example demonstrates:
 * - Using the iterator to get all keys and values
 * - Iterating over specific namespaces
 * - Filtering expired values automatically
 * - Using for-await-of loops
 */
import Keyv from "keyv";
import KeyvNedbStore from "../index.js";

async function main() {
	console.log("=== Iterator Example ===\n");

	// Example 1: Basic iteration
	console.log("Example 1: Basic iteration");
	const store1 = new KeyvNedbStore(".cache/iterator-example.nedb.yaml");
	const keyv1 = new Keyv({ store: store1 });

	// Add some data
	await keyv1.set("user:1", { name: "Alice", age: 30 });
	await keyv1.set("user:2", { name: "Bob", age: 25 });
	await keyv1.set("user:3", { name: "Charlie", age: 35 });
	await keyv1.set("product:1", { name: "Laptop", price: 999 });
	await keyv1.set("product:2", { name: "Mouse", price: 29 });

	console.log("\nIterating over all keys:");
	if (keyv1.iterator) {
		for await (const [key, value] of keyv1.iterator()) {
			console.log(`  ${key}:`, value);
		}
	}

	// Example 2: Iteration with namespace filtering
	console.log("\n\nExample 2: Namespace filtering");
	const store2 = new KeyvNedbStore(
		".cache/iterator-namespace-example.nedb.yaml",
		{ namespace: "app" }
	);
	const keyv2 = new Keyv({ store: store2 });

	// Add data with namespace
	await keyv2.set("config:theme", "dark");
	await keyv2.set("config:language", "en");
	await keyv2.set("user:admin", { name: "Admin", role: "admin" });
	await keyv2.set("user:guest", { name: "Guest", role: "guest" });

	console.log("\nIterating over namespace 'app':");
	if (keyv2.iterator) {
		for await (const [key, value] of keyv2.iterator()) {
			console.log(`  ${key}:`, value);
		}
	}

	// Example 3: Multiple namespaces in one file
	console.log("\n\nExample 3: Multiple namespaces");

	// Use separate files for each namespace to avoid concurrent access issues
	const usersStore = new KeyvNedbStore(".cache/iterator-users.nedb.yaml", { namespace: "users" });
	const sessionsStore = new KeyvNedbStore(".cache/iterator-sessions.nedb.yaml", { namespace: "sessions" });
	const cacheStore = new KeyvNedbStore(".cache/iterator-cache.nedb.yaml", { namespace: "cache" });

	await usersStore.ready;
	await sessionsStore.ready;
	await cacheStore.ready;

	const users = new Keyv({ store: usersStore });
	const sessions = new Keyv({ store: sessionsStore });
	const cache = new Keyv({ store: cacheStore });

	// Add data to different namespaces
	await users.set("1", { name: "Alice" });
	await users.set("2", { name: "Bob" });
	await sessions.set("abc", { userId: "1" });
	await sessions.set("def", { userId: "2" });
	await cache.set("popular", ["item1", "item2"]);

	console.log("\nIterating over 'users' namespace:");
	if (users.iterator) {
		for await (const [key, value] of users.iterator()) {
			console.log(`  ${key}:`, value);
		}
	}

	console.log("\nIterating over 'sessions' namespace:");
	if (sessions.iterator) {
		for await (const [key, value] of sessions.iterator()) {
			console.log(`  ${key}:`, value);
		}
	}

	console.log("\nIterating over 'cache' namespace:");
	if (cache.iterator) {
		for await (const [key, value] of cache.iterator()) {
			console.log(`  ${key}:`, value);
		}
	}

	// Example 4: Filtering expired values
	console.log("\n\nExample 4: Automatic filtering of expired values");
	const store4 = new KeyvNedbStore(".cache/iterator-ttl-example.nedb.yaml");
	const keyv4 = new Keyv({ store: store4 });

	// Add permanent and temporary values
	await keyv4.set("permanent:1", "stays forever");
	await keyv4.set("permanent:2", "also stays");
	await keyv4.set("temp:1", "expires in 2 seconds", 2000);
	await keyv4.set("temp:2", "also expires in 2 seconds", 2000);

	console.log("\nBefore expiration:");
	if (keyv4.iterator) {
		for await (const [key, value] of keyv4.iterator()) {
			console.log(`  ${key}:`, value);
		}
	}

	console.log("\nWaiting 2.5 seconds for TTL to expire...");
	await new Promise((resolve) => setTimeout(resolve, 2500));

	console.log("\nAfter expiration (temp values filtered out automatically):");
	if (keyv4.iterator) {
		for await (const [key, value] of keyv4.iterator()) {
			console.log(`  ${key}:`, value);
		}
	}

	// Example 5: Collecting all entries into an array
	console.log("\n\nExample 5: Collecting entries into an array");
	const store5 = new KeyvNedbStore(".cache/iterator-collect-example.nedb.yaml");
	const keyv5 = new Keyv({ store: store5 });

	await keyv5.set("item:1", "First");
	await keyv5.set("item:2", "Second");
	await keyv5.set("item:3", "Third");

	const entries = [];
	if (keyv5.iterator) {
		for await (const entry of keyv5.iterator()) {
			entries.push(entry);
		}
	}

	console.log("\nCollected entries:");
	console.log(entries);

	// Convert to object
	const obj = Object.fromEntries(entries);
	console.log("\nAs object:");
	console.log(obj);

	// Example 6: Count entries
	console.log("\n\nExample 6: Counting entries");
	let count = 0;
	if (keyv5.iterator) {
		for await (const _ of keyv5.iterator()) {
			count++;
		}
	}
	console.log(`Total entries: ${count}`);

	// Cleanup
	console.log("\nCleaning up...");
	await keyv1.clear();
	await keyv2.clear();
	await users.clear();
	await sessions.clear();
	await cache.clear();
	await keyv4.clear();
	await keyv5.clear();
	console.log("Cleanup complete!");
}

main().catch(console.error);
