import { publicFileUrl } from "../utils.js";
import { ApiError } from "../errors.js";
import { activeUserSql, projectUserBan } from "../user-status.js";

function mapUserSummary(row) {
	return {
		id: Number(row.id),
		username: row.username,
		displayName: row.display_name,
		avatarUrl: row.avatar_key ? publicFileUrl(row.avatar_key) : "",
	};
}

function mapAdminUser(row) {
	return {
		...mapUserSummary(row),
		...projectUserBan(row),
		createdAt: row.created_at,
	};
}

export async function countActiveUsers(db) {
	const { results } = await db
		.prepare(
			`SELECT COUNT(*) AS n
			 FROM users
			 WHERE deleted_at IS NULL`,
		)
		.all();
	return Number(results[0]?.n || 0);
}

export async function createUser(db, user) {
	try {
		const result = await db
			.prepare(
				`INSERT INTO users (
					 username,
					 display_name,
					 password_hash,
					 password_salt,
					 is_admin
				 ) VALUES (?, ?, ?, ?, ?)`,
			)
			.bind(
				user.username,
				user.displayName,
				user.passwordHash,
				user.passwordSalt,
				user.isAdmin ? 1 : 0,
			)
			.run();
		return Number(result.meta.last_row_id);
	} catch (error) {
		if (String(error?.message || error).includes("UNIQUE")) {
			throw new ApiError("用户名已存在");
		}
		throw error;
	}
}

export async function getUserByUsername(db, username) {
	const { results } = await db
		.prepare(
			`SELECT *
			 FROM users
			 WHERE username = ?
			   AND deleted_at IS NULL
			 LIMIT 1`,
		)
		.bind(username)
		.all();
	return results[0] || null;
}

export async function isUserActiveById(db, userId) {
	const { results } = await db
		.prepare(
			`SELECT id
			 FROM users
			 WHERE id = ?
			   AND deleted_at IS NULL
				   AND ${activeUserSql()}
			 LIMIT 1`,
		)
		.bind(Number(userId))
		.all();
	return Boolean(results[0]);
}

export async function listActiveUsers(db, excludeUserId) {
	const { results } = await db
		.prepare(
			`SELECT id, username, display_name, avatar_key
			 FROM users
			 WHERE deleted_at IS NULL
				   AND ${activeUserSql()}
			   AND id != ?
			 ORDER BY display_name ASC`,
		)
		.bind(Number(excludeUserId))
		.all();
	return results.map(mapUserSummary);
}

export async function listAdminUsers(db) {
	const { results } = await db
		.prepare(
			`SELECT id, username, display_name, avatar_key, is_disabled, disabled_until, created_at
			 FROM users
			 WHERE deleted_at IS NULL
			 ORDER BY created_at DESC`,
		)
		.all();
	return results.map(mapAdminUser);
}

export async function listStorageOwners(db) {
	const { results } = await db
		.prepare(
			`SELECT id, username, display_name, deleted_at
			 FROM users
			 ORDER BY id ASC`,
		)
		.all();
	return results.map((row) => ({
		id: Number(row.id),
		username: row.username,
		displayName: row.display_name,
		isDeleted: Boolean(row.deleted_at),
	}));
}
