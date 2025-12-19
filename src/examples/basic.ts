/**
 * Basic usage example of keyv-nedb-store
 *
 * This example demonstrates:
 * - Creating a simple store with file-based persistence
 * - Basic CRUD operations (Create, Read, Update, Delete)
 * - Clearing all data
 */
import Keyv from "keyv";
import KeyvNedbStore from "../index.js";

async function main() {
	console.log("=== Basic Usage Example ===\n");

	// Create a store with file-based persistence
	const store = new KeyvNedbStore(".cache/basic-example.nedb.yaml");
	const keyv = new Keyv({ store });

	// Set a value
	console.log("Setting 'foo' to 'bar'...");
	await keyv.set("foo", "bar");

	// Get a value
	console.log("Getting 'foo'...");
	const value = await keyv.get("foo");
	console.log(`Value: ${value}\n`);

	// Update a value
	console.log("Updating 'foo' to 'baz'...");
	await keyv.set("foo", "baz");
	const updatedValue = await keyv.get("foo");
	console.log(`Updated value: ${updatedValue}\n`);

	// Set multiple values
	console.log("Setting multiple values...");
	await keyv.set("user:1", "Alice");
	await keyv.set("user:2", "Bob");
	await keyv.set("user:3", "Charlie");
	console.log("Values set!\n");

	// Delete a value
	console.log("Deleting 'foo'...");
	const deleted = await keyv.delete("foo");
	console.log(`Deleted: ${deleted}\n`);

	// Verify deletion
	const deletedValue = await keyv.get("foo");
	console.log(`Value after deletion: ${deletedValue}\n`);

	// Clear all values
	console.log("Clearing all values...");
	await keyv.clear();
	console.log("All values cleared!\n");

	// Verify clear
	const user1 = await keyv.get("user:1");
	console.log(`user:1 after clear: ${user1}`);
}

main().catch(console.error);
