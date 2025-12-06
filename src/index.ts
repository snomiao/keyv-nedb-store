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
export class KeyvNedbStore implements KeyvStoreAdapter {
	db: NeDB;
	opts: NeDB.DataStoreOptions;
	namespace?: string;

	/**
	 * by default, nedb have limitations on keys, e.g. no dot(.) allowed, no $ at the beginning
	 * so we provide serialize and deserialize options to handle complex keys/values if needed
	 * usually, JSON.stringify and JSON.parse are sufficient
	 */
	serializer?: {
		parse: (data: string) => any;
		stringify: (data: any) => string;
	};

	constructor(
		options:
			| string
			| (NeDB.DataStoreOptions & {
					namespace?: string;
					serializer?: {
						parse: (data: string) => any;
						stringify: (data: any) => string;
					};
			  }) = {},
	) {
		if (typeof options === "string") {
			options = { filename: options, autoload: true };
		}
		this.opts = options;
		this.namespace = options.namespace;
		this.serializer = options.serializer;
		this.db = new NeDB(options);
		this.db.ensureIndexAsync({ fieldName: "key", unique: true });
		this.db.removeAsync({ expiredAt: { $lt: Date.now() } }, { multi: false });
		this.db.compactDatafileAsync();
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
		const doc = await this.db.findOneAsync({ key: prefixedKey });
		if (!doc) {
			return undefined;
		}
		if (doc?.expiredAt && doc.expiredAt < Date.now()) {
			await this.db.removeAsync({ key: prefixedKey }, { multi: false });
			return undefined;
		}
		return this.serializer ? this.serializer.parse(doc.value) : doc.value;
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
			{ key: prefixedKey },
			{
				key: prefixedKey,
				value: this.serializer ? this.serializer.stringify(value) : value,
				updatedAt: Date.now(),
				expiredAt: ttl ? Date.now() + ttl : null,
			},
			{ upsert: true },
		);
	}

	async delete(key: string) {
		const prefixedKey = this._getKey(key);
		const results = await this.db.removeAsync(
			{ key: prefixedKey },
			{ multi: true },
		);
		return results > 0;
	}

	async clear(): Promise<void> {
		if (this.namespace) {
			// Only clear keys with this namespace
			const pattern = new RegExp(`^${this.namespace}:`);
			await this.db.removeAsync({ key: pattern }, { multi: true });
		} else {
			// Clear all keys if no namespace
			await this.db.removeAsync({}, { multi: true });
		}
	}
}
