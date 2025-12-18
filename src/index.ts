import type Nedb from "@seald-io/nedb";
import NeDB from "@seald-io/nedb";
import type { KeyvStoreAdapter } from "keyv";

/**
 * A Keyv store implementation using NeDB as the backend.
 *
 * @example
 * ```ts
 * import Keyv from "keyv";
 * import { KeyvNedbStore } from "./KeyvNedbStore";
 *
 * // nedb is yaml linter friendly
 * const filename = "path/to/database.nedb.yaml";
 *
 * const store = new KeyvNedbStore({ filename, autoload: true });
 * const keyv = new Keyv({ store });
 *
 * await keyv.set("foo", "bar");
 * const value = await keyv.get("foo"); // "bar"
 *
 * peek into the database file to see the stored data
 * ```
 */
export default class KeyvNedbStore implements KeyvStoreAdapter {
	db: NeDB;
	opts: NeDB.DataStoreOptions | Nedb;
	namespace?: string;
	ready: Promise<void>;
	/**
	 * nedb have limitations on keys, e.g. no dot(.) allowed, no $ at the beginning
	 * so we provide serialize and deserialize options to handle complex keys/values if needed
	 *
	 * by default, we escape dot(.) and $ with %2E and %24 respectively
	 *
	 * @example
	 * ```ts
	 * const store = new KeyvNedbStore({
	 *   filename: "path/to/database.nedb",
	 *   autoload: true,
	 *   serializer: {
	 *     stringify: (data) => {
	 *       // custom serialization logic
	 *       return customStringify(data);
	 *     },
	 *     parse: (data) => {
	 *       // custom deserialization logic
	 *       return customParse(data);
	 *     },
	 *   },
	 * });
	 * ```
	 */
	serializer?: {
		parse: (data: any) => any;
		stringify: (data: any) => any;
	};

	constructor(
		uri?: string | NeDB.DataStoreOptions | Nedb,
		options: {
			namespace?: string;
			serializer?: {
				parse: (data: any) => any;
				stringify: (data: any) => any;
			};
		} = {},
	) {
		this.namespace = options.namespace;
		this.serializer = options.serializer ?? {
			stringify: escapeKeys,
			parse: unescapeKeys,
		};
		this.opts =
			uri instanceof NeDB
				? {}
				: typeof uri === "string"
					? { filename: uri, autoload: true }
					: uri || {};
		const db = uri instanceof NeDB ? uri : new NeDB(this.opts);
		this.db = db;

		// Promisify NeDB methods we use
		this.ready = (async () => {
			await db.removeAsync(
				{ expiredAt: { $lt: Date.now() } },
				{ multi: false },
			);
			await db.compactDatafileAsync();
		})();
	}

	// IEventEmitter interface methods
	on(_event: string, _listener: (...arguments_: any[]) => void): this {
		// NeDB doesn't have event emitter, so we return this for compatibility
		return this;
	}

	private _getKey(key: string): string {
		return this.namespace ? `${this.namespace}:${key}` : key;
	}

	async get<Value>(key: string): Promise<Value | undefined> {
		const prefixedKey = this._getKey(key);
		const doc = await this.db.findOneAsync({ _id: prefixedKey });
		if (!doc) {
			return undefined;
		}
		if (doc?.expiredAt && doc.expiredAt < Date.now()) {
			await this.db.removeAsync({ _id: prefixedKey }, { multi: false });
			return undefined;
		}
		return this.serializer?.parse
			? this.serializer.parse(doc.value)
			: doc.value;
	}
	async getMany<Value>(keys: string[]): Promise<Array<Value | undefined>> {
		const results: Array<Value | undefined> = [];
		for (const key of keys) {
			const value = await this.get<Value>(key);
			results.push(value);
		}
		return results;
	}

	async set(key: string, value: any, ttl?: number): Promise<void> {
		const prefixedKey = this._getKey(key);
		await this.db.updateAsync(
			{ _id: prefixedKey },
			{
				$set: {
					_id: prefixedKey,
					value: this.serializer?.stringify
						? this.serializer.stringify(value)
						: value,
					updatedAt: Date.now(),
					expiredAt: ttl ? Date.now() + ttl : null,
				},
			},
			{ upsert: true },
		);
	}

	async delete(key: string) {
		const prefixedKey = this._getKey(key);
		const results = await this.db.removeAsync(
			{ _id: prefixedKey },
			{ multi: true },
		);
		return results > 0;
	}

	async clear(): Promise<void> {
		if (this.namespace) {
			// Only clear keys with this namespace
			const pattern = new RegExp(`^${this.namespace}:`);
			await this.db.removeAsync({ _id: pattern }, { multi: true });
			await this.db.compactDatafileAsync();
		} else {
			// Clear all keys if no namespace
			await this.db.removeAsync({}, { multi: true });
			await this.db.compactDatafileAsync();
		}
	}
}

export function escapeKeys(o: any): any {
	if (Array.isArray(o)) {
		return o.map(escapeKeys);
	} else if (o && typeof o === "object") {
		const newObj: any = {};
		for (const [k, v] of Object.entries(o)) {
			// Escape % first to avoid double-escaping
			const safeKey = k
				.replace(/%/g, "%25")
				.replace(/\./g, "%2E")
				.replace(/\$/g, "%24");
			newObj[safeKey] = escapeKeys(v);
		}
		return newObj;
	}
	return o;
}
export function unescapeKeys(o: any): any {
	if (Array.isArray(o)) {
		return o.map(unescapeKeys);
	} else if (o && typeof o === "object") {
		const newObj: any = {};
		for (const [k, v] of Object.entries(o)) {
			// Unescape % last to avoid double-unescaping
			const safeKey = k
				.replace(/%2E/g, ".")
				.replace(/%24/g, "$")
				.replace(/%25/g, "%");
			newObj[safeKey] = unescapeKeys(v);
		}
		return newObj;
	}
	return o;
}
