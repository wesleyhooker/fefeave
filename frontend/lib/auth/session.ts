// Backward-compatible re-export; use session.node.ts in route handlers
// and session.edge.ts in middleware for explicit runtime compatibility.
export * from './session.node';
export * from './session.types';
