/**
 * Cache usage example
 *
 * This example demonstrates:
 * - Using keyv-nedb-store as a caching layer
 * - Implementing cache-aside pattern
 * - Managing cache invalidation with TTL
 */
import Keyv from "keyv";
import KeyvNedbStore from "../index.js";

// Simulate an expensive API call
async function fetchUserFromAPI(userId: string) {
	console.log(`  → Fetching user ${userId} from API (slow)...`);
	await new Promise((resolve) => setTimeout(resolve, 1000));
	return {
		id: userId,
		name: `User ${userId}`,
		email: `user${userId}@example.com`,
		fetchedAt: new Date().toISOString(),
	};
}

// Get user with caching
async function getUser(keyv: Keyv, userId: string) {
	const cacheKey = `user:${userId}`;

	// Try to get from cache first
	let user = await keyv.get(cacheKey);

	if (user) {
		console.log(`  ✓ Cache hit for user ${userId}`);
		return user;
	}

	console.log(`  ✗ Cache miss for user ${userId}`);

	// Fetch from "API" and cache the result
	user = await fetchUserFromAPI(userId);

	// Cache for 5 seconds
	await keyv.set(cacheKey, user, 5000);

	return user;
}

async function main() {
	console.log("=== Cache Usage Example ===\n");

	const store = new KeyvNedbStore(".cache/cache-example.nedb.yaml");
	const keyv = new Keyv({ store });

	// First request - will fetch from API
	console.log("First request for user 1:");
	const user1 = await getUser(keyv, "1");
	console.log("Result:", user1);
	console.log();

	// Second request - will use cache
	console.log("Second request for user 1 (should be cached):");
	const user1Cached = await getUser(keyv, "1");
	console.log("Result:", user1Cached);
	console.log();

	// Request different user - will fetch from API
	console.log("Request for user 2:");
	const user2 = await getUser(keyv, "2");
	console.log("Result:", user2);
	console.log();

	// Request user 2 again - will use cache
	console.log("Second request for user 2 (should be cached):");
	const user2Cached = await getUser(keyv, "2");
	console.log("Result:", user2Cached);
	console.log();

	// Wait for cache to expire
	console.log("Waiting 6 seconds for cache to expire...");
	await new Promise((resolve) => setTimeout(resolve, 6000));
	console.log();

	// Request after expiration - will fetch from API again
	console.log("Request for user 1 after cache expiration:");
	const user1Expired = await getUser(keyv, "1");
	console.log("Result:", user1Expired);
	console.log();

	// Manual cache invalidation
	console.log("Manually invalidating cache for user 2...");
	await keyv.delete("user:2");
	console.log();

	console.log("Request for user 2 after manual invalidation:");
	const user2Invalidated = await getUser(keyv, "2");
	console.log("Result:", user2Invalidated);

	// Cleanup
	console.log("\nCleaning up...");
	await keyv.clear();
	console.log("Cleanup complete!");
}

main().catch(console.error);
