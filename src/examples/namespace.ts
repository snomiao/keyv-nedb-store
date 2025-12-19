/**
 * Namespace example
 *
 * This example demonstrates:
 * - Using namespaces to organize data
 * - Isolating data between different namespaces
 * - Clearing namespace-specific data
 */
import Keyv from "keyv";
import KeyvNedbStore from "../index.js";

async function main() {
	console.log("=== Namespace Example ===\n");

	// Create stores with different namespaces using the same file
	// Note: In production, you might want to use a single database instance
	const dbFile = ".cache/namespace-example.nedb.yaml";

	const userStore = new KeyvNedbStore(dbFile, { namespace: "users" });
	await userStore.ready;

	const sessionStore = new KeyvNedbStore(dbFile, { namespace: "sessions" });
	await sessionStore.ready;

	const cacheStore = new KeyvNedbStore(dbFile, { namespace: "cache" });
	await cacheStore.ready;

	const users = new Keyv({ store: userStore });
	const sessions = new Keyv({ store: sessionStore });
	const cache = new Keyv({ store: cacheStore });

	// Set values in different namespaces
	console.log("Setting values in different namespaces...\n");

	await users.set("1", { name: "Alice", email: "alice@example.com" });
	await users.set("2", { name: "Bob", email: "bob@example.com" });

	await sessions.set("abc123", { userId: "1", expiry: Date.now() + 3600000 });
	await sessions.set("def456", { userId: "2", expiry: Date.now() + 3600000 });

	await cache.set("popular-posts", ["post1", "post2", "post3"]);
	await cache.set("featured-content", { id: "featured1", title: "Welcome" });

	// Retrieve values from different namespaces
	console.log("Users namespace:");
	console.log("  User 1:", await users.get("1"));
	console.log("  User 2:", await users.get("2"));

	console.log("\nSessions namespace:");
	console.log("  Session abc123:", await sessions.get("abc123"));
	console.log("  Session def456:", await sessions.get("def456"));

	console.log("\nCache namespace:");
	console.log("  Popular posts:", await cache.get("popular-posts"));
	console.log("  Featured content:", await cache.get("featured-content"));

	// Clear only sessions namespace
	console.log("\nClearing sessions namespace...");
	await sessions.clear();

	console.log("\nAfter clearing sessions:");
	console.log("  Session abc123:", await sessions.get("abc123")); // undefined
	console.log("  User 1:", await users.get("1")); // still exists
	console.log("  Popular posts:", await cache.get("popular-posts")); // still exists

	// Cleanup all namespaces
	console.log("\nCleaning up all namespaces...");
	await users.clear();
	await cache.clear();
	console.log("Cleanup complete!");
}

main().catch(console.error);
