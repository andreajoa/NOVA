import { queryD1, d1Rows } from "@/lib/db";

export async function ensureMusicVideoTables() {
  await queryD1(`
    CREATE TABLE IF NOT EXISTS music_video_jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT,
      artist_name TEXT,
      status TEXT NOT NULL,
      audio_url TEXT,
      lyrics TEXT,
      style TEXT,
      aspect_ratio TEXT,
      duration_seconds INTEGER,
      scene_seconds INTEGER,
      model_key TEXT,
      mode_key TEXT,
      scenes_json TEXT,
      final_url TEXT,
      error TEXT,
      created_at INTEGER,
      updated_at INTEGER
    )
  `);
}

function now() {
  return Math.floor(Date.now() / 1000);
}

export function normalizeMusicVideoJob(row) {
  if (!row) return null;

  let scenes = [];
  try {
    scenes = JSON.parse(String(row.scenes_json || "[]"));
  } catch {
    scenes = [];
  }

  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title || ""),
    artistName: String(row.artist_name || ""),
    status: String(row.status || "draft"),
    audioUrl: String(row.audio_url || ""),
    lyrics: String(row.lyrics || ""),
    style: String(row.style || "cinematic"),
    aspectRatio: String(row.aspect_ratio || "16:9"),
    durationSeconds: Number(row.duration_seconds || 180),
    sceneSeconds: Number(row.scene_seconds || 10),
    modelKey: String(row.model_key || "seedance"),
    modeKey: String(row.mode_key || "text-to-video"),
    scenes,
    finalUrl: String(row.final_url || ""),
    error: String(row.error || ""),
    createdAt: Number(row.created_at || 0),
    updatedAt: Number(row.updated_at || 0),
  };
}

export async function createMusicVideoJob(data) {
  await ensureMusicVideoTables();

  const id = globalThis.crypto.randomUUID();
  const ts = now();

  await queryD1(
    `INSERT INTO music_video_jobs (
      id, user_id, title, artist_name, status, audio_url, lyrics, style,
      aspect_ratio, duration_seconds, scene_seconds, model_key, mode_key,
      scenes_json, final_url, error, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', ?, ?)`,
    [
      id,
      data.userId,
      data.title || "NOVA Music Video",
      data.artistName || "",
      "storyboard",
      data.audioUrl || "",
      data.lyrics || "",
      data.style || "cinematic",
      data.aspectRatio || "16:9",
      Number(data.durationSeconds || 180),
      Number(data.sceneSeconds || 10),
      data.modelKey || "seedance",
      data.modeKey || "text-to-video",
      JSON.stringify(data.scenes || []),
      ts,
      ts,
    ]
  );

  return getMusicVideoJob(id, data.userId);
}

export async function getMusicVideoJob(id, userId) {
  await ensureMusicVideoTables();

  const res = await queryD1(
    `SELECT * FROM music_video_jobs WHERE id = ? AND user_id = ? LIMIT 1`,
    [id, userId]
  );

  return normalizeMusicVideoJob(d1Rows(res)[0]);
}

export async function listMusicVideoJobs(userId) {
  await ensureMusicVideoTables();

  const res = await queryD1(
    `SELECT * FROM music_video_jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`,
    [userId]
  );

  return d1Rows(res).map(normalizeMusicVideoJob).filter(Boolean);
}

export async function updateMusicVideoJob(id, userId, patch) {
  const existing = await getMusicVideoJob(id, userId);
  if (!existing) return null;

  const next = {
    ...existing,
    ...patch,
    updatedAt: now(),
  };

  await queryD1(
    `UPDATE music_video_jobs
     SET title = ?, artist_name = ?, status = ?, audio_url = ?, lyrics = ?, style = ?,
         aspect_ratio = ?, duration_seconds = ?, scene_seconds = ?, model_key = ?, mode_key = ?,
         scenes_json = ?, final_url = ?, error = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
    [
      next.title,
      next.artistName,
      next.status,
      next.audioUrl,
      next.lyrics,
      next.style,
      next.aspectRatio,
      Number(next.durationSeconds || 180),
      Number(next.sceneSeconds || 10),
      next.modelKey,
      next.modeKey,
      JSON.stringify(next.scenes || []),
      next.finalUrl || "",
      next.error || "",
      next.updatedAt,
      id,
      userId,
    ]
  );

  return getMusicVideoJob(id, userId);
}
