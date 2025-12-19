/**
 * Complex objects example
 *
 * This example demonstrates:
 * - Storing nested objects and arrays
 * - Handling special characters in keys
 * - Working with various data types
 */
import Keyv from "keyv";
import KeyvNedbStore from "../index.js";

async function main() {
	console.log("=== Complex Objects Example ===\n");

	const store = new KeyvNedbStore(".cache/complex-example.nedb.yaml");
	const keyv = new Keyv({ store });

	// Store a complex user object
	console.log("Storing complex user object...");
	const user = {
		id: "user123",
		name: "Alice",
		email: "alice@example.com",
		preferences: {
			theme: "dark",
			notifications: {
				email: true,
				push: false,
				sms: true,
			},
		},
		roles: ["admin", "user", "moderator"],
		metadata: {
			created: new Date().toISOString(),
			lastLogin: new Date().toISOString(),
			loginCount: 42,
		},
	};

	await keyv.set("user:alice", user);

	// Retrieve and display
	const retrievedUser = await keyv.get("user:alice");
	console.log("Retrieved user:", JSON.stringify(retrievedUser, null, 2));

	// Store an array of objects
	console.log("\nStoring array of posts...");
	const posts = [
		{
			id: "post1",
			title: "First Post",
			content: "Hello world!",
			tags: ["intro", "welcome"],
		},
		{
			id: "post2",
			title: "Second Post",
			content: "More content here",
			tags: ["update", "news"],
		},
		{
			id: "post3",
			title: "Third Post",
			content: "Even more content",
			tags: ["tutorial", "guide"],
		},
	];

	await keyv.set("posts:recent", posts);
	const retrievedPosts = await keyv.get("posts:recent");
	console.log("Retrieved posts:", JSON.stringify(retrievedPosts, null, 2));

	// Store objects with special characters in keys
	// (the store automatically escapes dots and dollar signs)
	console.log("\nStoring object with special characters in keys...");
	const config = {
		"api.endpoint": "https://api.example.com",
		"api.key": "secret123",
		"$schema": "https://json-schema.org/draft-07/schema",
		"features.enabled": true,
		"features.beta": false,
	};

	await keyv.set("config", config);
	const retrievedConfig = await keyv.get("config");
	console.log("Retrieved config:", JSON.stringify(retrievedConfig, null, 2));

	// Store different data types
	console.log("\nStoring different data types...");
	await keyv.set("string", "Hello World");
	await keyv.set("number", 42);
	await keyv.set("boolean", true);
	await keyv.set("null-value", null);
	await keyv.set("array", [1, 2, 3, 4, 5]);
	await keyv.set("object", { a: 1, b: 2 });

	console.log("string:", await keyv.get("string"));
	console.log("number:", await keyv.get("number"));
	console.log("boolean:", await keyv.get("boolean"));
	console.log("null-value:", await keyv.get("null-value"));
	console.log("array:", await keyv.get("array"));
	console.log("object:", await keyv.get("object"));

	// Cleanup
	console.log("\nCleaning up...");
	await keyv.clear();
	console.log("Cleanup complete!");
}

main().catch(console.error);
