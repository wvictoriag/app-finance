# Changelog

## [Unreleased]

### Added
- **MCP Configuration:** Added `stitch` server to the MCP configuration for improved tool capabilities.

### Fixed
- **Magic Button (Plus button):** Moved to a global fixed position. It is now always visible and accessible across all views (Dashboard, Projections, Stats, Calendar, Goals), and stays fixed while scrolling transactions.
- **Account Reconciliation:** Fixed logic where accounts were force-squared. Now, updating the balance via the reconciliation modal will correctly show the account as "Descuadrada" (Faltan/Sobran) until the corresponding transactions are entered.
- **Last Update Date:** Accounts now reflect the date of the **latest transaction** (max date) as their last update, rather than the real-time entry date. This remains accurate even after adding/editing/deleting transactions.
