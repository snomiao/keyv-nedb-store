/**
 * In-memory store example
 *
 * This example demonstrates:
 * - Using NeDB in memory-only mode (no file persistence)
 * - Fast storage for temporary data
 * - Testing scenarios
 */
import Keyv from "keyv";
import KeyvNedbStore from "../index.js";

async function main() {
	console.log("=== In-Memory Store Example ===\n");

	// Create an in-memory only store (no file persistence)
	const store = new KeyvNedbStore({ inMemoryOnly: true });
	const keyv = new Keyv({ store });

	console.log("Store created in memory-only mode (no file will be created)\n");

	// Perform operations
	console.log("Setting values...");
	await keyv.set("temp:1", "First value");
	await keyv.set("temp:2", "Second value");
	await keyv.set("temp:3", "Third value");

	console.log("\nRetrieving values:");
	console.log("temp:1:", await keyv.get("temp:1"));
	console.log("temp:2:", await keyv.get("temp:2"));
	console.log("temp:3:", await keyv.get("temp:3"));

	// Test with TTL
	console.log("\nSetting value with 2 second TTL...");
	await keyv.set("temp:expiring", "Will expire", 2000);

	console.log("Value immediately:", await keyv.get("temp:expiring"));

	console.log("\nWaiting 2.5 seconds...");
	await new Promise((resolve) => setTimeout(resolve, 2500));

	console.log("Value after expiration:", await keyv.get("temp:expiring"));

	// Use case: Session storage
	console.log("\n\nUse case: Temporary session storage");
	const sessionStore = new KeyvNedbStore({ inMemoryOnly: true });
	const sessions = new Keyv({ store: sessionStore });

	// Store session with 10 second TTL
	const sessionData = {
		userId: "user123",
		token: "abc123xyz",
		createdAt: new Date().toISOString(),
	};

	await sessions.set("session:abc123", sessionData, 10000);
	console.log("Session stored:", await sessions.get("session:abc123"));

	// Use case: Testing cache
	console.log("\n\nUse case: Test environment cache");
	const testCache = new KeyvNedbStore({ inMemoryOnly: true });
	const cache = new Keyv({ store: testCache });

	// Cache some test data
	await cache.set("test:data:1", { result: "success" });
	await cache.set("test:data:2", { result: "failure" });

	console.log("Test data 1:", await cache.get("test:data:1"));
	console.log("Test data 2:", await cache.get("test:data:2"));

	// Clear and verify
	await cache.clear();
	console.log("After clear:", await cache.get("test:data:1"));

	console.log(
		"\nAll data is stored in memory and will be lost when the process exits."
	);
	console.log("No files were created during this example.");
}

main().catch(console.error);
