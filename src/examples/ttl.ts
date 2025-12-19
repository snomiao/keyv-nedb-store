/**
 * TTL (Time-To-Live) example
 *
 * This example demonstrates:
 * - Setting values with expiration times
 * - Automatic cleanup of expired values
 * - Different TTL durations
 */
import Keyv from "keyv";
import KeyvNedbStore from "../index.js";

async function main() {
	console.log("=== TTL (Time-To-Live) Example ===\n");

	const store = new KeyvNedbStore(".cache/ttl-example.nedb.yaml");
	const keyv = new Keyv({ store });

	// Set a value that expires in 2 seconds
	console.log("Setting 'temp' with 2 second TTL...");
	await keyv.set("temp", "will expire soon", 2000);

	// Set a value that expires in 5 seconds
	console.log("Setting 'longer-temp' with 5 second TTL...");
	await keyv.set("longer-temp", "will expire later", 5000);

	// Set a permanent value (no TTL)
	console.log("Setting 'permanent' with no TTL...");
	await keyv.set("permanent", "stays forever");

	console.log("\nWaiting 1 second...");
	await new Promise((resolve) => setTimeout(resolve, 1000));

	console.log("\nChecking values after 1 second:");
	console.log("temp:", await keyv.get("temp")); // should exist
	console.log("longer-temp:", await keyv.get("longer-temp")); // should exist
	console.log("permanent:", await keyv.get("permanent")); // should exist

	console.log("\nWaiting 2 more seconds...");
	await new Promise((resolve) => setTimeout(resolve, 2000));

	console.log("\nChecking values after 3 seconds total:");
	console.log("temp:", await keyv.get("temp")); // should be undefined
	console.log("longer-temp:", await keyv.get("longer-temp")); // should exist
	console.log("permanent:", await keyv.get("permanent")); // should exist

	console.log("\nWaiting 3 more seconds...");
	await new Promise((resolve) => setTimeout(resolve, 3000));

	console.log("\nChecking values after 6 seconds total:");
	console.log("temp:", await keyv.get("temp")); // should be undefined
	console.log("longer-temp:", await keyv.get("longer-temp")); // should be undefined
	console.log("permanent:", await keyv.get("permanent")); // should exist

	// Cleanup
	await keyv.clear();
	console.log("\nCleanup complete!");
}

main().catch(console.error);
