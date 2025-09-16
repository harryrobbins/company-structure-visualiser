// frontend/src/db.js
import Dexie from 'dexie';

export const db = new Dexie('CompanyVisualizerDB');

// Define a more robust, relational schema based on your feedback.
// We are bumping the version to 2 to signal a schema change.
db.version(2).stores({
  // ++id is an auto-incrementing primary key. This table tracks uploads.
  spreadsheets: '++id, name, lastUpdated',

  // This table stores individual companies, linked to a spreadsheet.
  // We index 'spreadsheetId' to easily query for all companies in a sheet.
  // We index 'uuid' as it will be the unique ID for graph nodes.
  companies: '++id, spreadsheetId, uuid, companyName',

  // This table stores the ownership links, using the company UUIDs.
  ownership: '++id, spreadsheetId, ownerUuid, ownsUuid',
});

