/**
 * Format ISO date string to "Sep 20, 2025" format
 * @param {string} isoString - ISO 8601 date string
 * @returns {string} Formatted date string
 */
export function formatDate(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return isoString;
  }
}
