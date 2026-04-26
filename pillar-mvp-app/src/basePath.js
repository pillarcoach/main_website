// Returns the directory portion of the current URL path (e.g. "/beta/" or "/").
// Handles both "/beta" and "/beta/" — strips the filename if present, keeps the dir.
function computeBase() {
  const path = window.location.pathname;
  // If path ends with .html it's a subpage — use its directory
  if (path.endsWith('.html')) return path.replace(/\/[^/]*$/, '/');
  // Otherwise it's a directory (with or without trailing slash)
  return path.endsWith('/') ? path : path + '/';
}

export const base = computeBase();

export function navigate(page) {
  window.location.href = base + page;
}

export function replace(page) {
  window.location.replace(base + page);
}
