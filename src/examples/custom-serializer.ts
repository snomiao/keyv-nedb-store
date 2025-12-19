/**
 * Custom serializer example
 *
 * This example demonstrates:
 * - Using custom serialization logic
 * - Handling Date objects properly
 * - Implementing compression for large values
 */
import Keyv from "keyv";
import KeyvNedbStore from "../index.js";

// Custom serializer that handles Date objects
const dateSerializer = {
	stringify: (data: any): any => {
		if (data instanceof Date) {
			return { __type: "Date", value: data.toISOString() };
		}
		if (Array.isArray(data)) {
			return data.map((item) => dateSerializer.stringify(item));
		}
		if (data && typeof data === "object") {
			const result: any = {};
			for (const [key, value] of Object.entries(data)) {
				result[key] = dateSerializer.stringify(value);
			}
			return result;
		}
		return data;
	},
	parse: (data: any): any => {
		if (data && typeof data === "object" && data.__type === "Date") {
			return new Date(data.value);
		}
		if (Array.isArray(data)) {
			return data.map((item) => dateSerializer.parse(item));
		}
		if (data && typeof data === "object") {
			const result: any = {};
			for (const [key, value] of Object.entries(data)) {
				result[key] = dateSerializer.parse(value);
			}
			return result;
		}
		return data;
	},
};

async function main() {
	console.log("=== Custom Serializer Example ===\n");

	// Example 1: Date serializer
	console.log("Example 1: Custom Date serializer");
	const store1 = new KeyvNedbStore(
		".cache/serializer-example.nedb.yaml",
		{
			serializer: dateSerializer,
		}
	);
	const keyv1 = new Keyv({ store: store1 });

	const event = {
		name: "Conference",
		startDate: new Date("2024-12-01T09:00:00Z"),
		endDate: new Date("2024-12-03T17:00:00Z"),
		registrationDeadline: new Date("2024-11-15T23:59:59Z"),
	};

	console.log("Original event:", event);
	console.log("  startDate type:", event.startDate.constructor.name);

	await keyv1.set("event:conference", event);
	const retrievedEvent = await keyv1.get("event:conference");

	console.log("\nRetrieved event:", retrievedEvent);
	console.log("  startDate type:", retrievedEvent.startDate.constructor.name);
	console.log(
		"  startDate is Date instance:",
		retrievedEvent.startDate instanceof Date
	);

	// Example 2: Using default serializer (with key escaping)
	console.log("\n\nExample 2: Default serializer with key escaping");
	const store2 = new KeyvNedbStore(".cache/escaped-keys-example.nedb.yaml");
	const keyv2 = new Keyv({ store: store2 });

	const complexKeys = {
		"user.name": "Alice",
		"user.email": "alice@example.com",
		"$metadata": {
			"created.at": "2024-01-01",
			"$version": 1,
		},
		"settings.theme": "dark",
		"settings.language": "en",
	};

	console.log("Original object with special characters in keys:", complexKeys);

	await keyv2.set("config:complex", complexKeys);
	const retrievedConfig = await keyv2.get("config:complex");

	console.log("\nRetrieved config:", retrievedConfig);
	console.log("  Keys preserved correctly:", {
		"user.name": retrievedConfig["user.name"] === "Alice",
		"$metadata.$version": retrievedConfig.$metadata?.$version === 1,
	});

	// Example 3: No serializer (store raw values)
	console.log("\n\nExample 3: No serializer (only for simple values)");
	const store3 = new KeyvNedbStore(
		".cache/no-serializer-example.nedb.yaml",
		{
			serializer: {
				stringify: (data: any) => data,
				parse: (data: any) => data,
			},
		}
	);
	const keyv3 = new Keyv({ store: store3 });

	// Only safe with simple key-value pairs
	await keyv3.set("simple:string", "hello");
	await keyv3.set("simple:number", 42);
	await keyv3.set("simple:array", [1, 2, 3]);

	console.log("simple:string:", await keyv3.get("simple:string"));
	console.log("simple:number:", await keyv3.get("simple:number"));
	console.log("simple:array:", await keyv3.get("simple:array"));

	// Cleanup
	console.log("\nCleaning up...");
	await keyv1.clear();
	await keyv2.clear();
	await keyv3.clear();
	console.log("Cleanup complete!");
}

main().catch(console.error);
