// static/js/db.js (ESM)
// Modern Dexie usage with an indexed 'createdAt' field and a migration from v1 -> v2
// Requires import map entry: "dexie": "\[\[ url\_for('static', path='/libs/dexie.mjs') ]]"

import Dexie from 'dexie';

export const db = new Dexie('PDFExtractorDB');

// --- v1 schema (historical) ---
// pdfs: '++id, name, fileHandle, pages, responseText'
// (did NOT index 'createdAt')

// --- v2 schema ---
// Add 'createdAt' as an indexed field so orderBy('createdAt') works.
// Keep other fields as before.

// Define old version for users upgrading from v1 (safe if DB is fresh)
db.version(1).stores({
pdfs: '++id, name, fileHandle, pages, responseText'
});

// Define new version with createdAt index and migration
// NOTE: Dexie applies the highest matching version on open
// and runs 'upgrade' only when migrating from lower versions.
db.version(2).stores({
pdfs: '++id, createdAt, name, fileHandle, pages, responseText'
}).upgrade(async (tx) => {
const table = tx.table('pdfs');
await table.toCollection().modify((p) => {
if (p.createdAt == null) p.createdAt = new Date();
});
});

// Optional explicit open (Dexie opens lazily too)
db.open().catch((e) => {
console.error('Dexie open failed:', e);
});
