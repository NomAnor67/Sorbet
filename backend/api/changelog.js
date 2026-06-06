import { randomUUID } from 'crypto';
import db from '../db.js';

export async function getChangelogHandler(req, res) {
  const entries = db.prepare(
    'SELECT c.*, u.username, u.avatar_url FROM changelog c LEFT JOIN users u ON c.author_id = u.id ORDER BY c.created_at DESC'
  ).all();
  res.json({ entries });
}

export async function createChangelogHandler(req, res) {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.session.user.id);
  if (!user || user.is_admin < 1) return res.status(403).json({ error: 'Admin access required' });
  const { title, content } = req.body;
  if (!title || typeof title !== 'string' || title.length < 1 || title.length > 200) return res.status(400).json({ error: 'Invalid title' });
  if (!content || typeof content !== 'string' || content.length < 1 || content.length > 10000) return res.status(400).json({ error: 'Invalid content' });
  const id = randomUUID();
  const now = Date.now();
  db.prepare('INSERT INTO changelog (id, title, content, author_id, created_at) VALUES (?, ?, ?, ?, ?)').run(id, title, content, req.session.user.id, now);
  res.status(201).json({ message: 'Changelog entry created', id });
}

export async function deleteChangelogHandler(req, res) {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.session.user.id);
  if (!user || user.is_admin < 1) return res.status(403).json({ error: 'Admin access required' });
  const { id } = req.params;
  db.prepare('DELETE FROM changelog WHERE id = ?').run(id);
  res.json({ message: 'Deleted' });
}