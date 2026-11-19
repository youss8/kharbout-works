# 0004 · Let the host supply search results and own the shortcut

Browse and direct entry pages need the same discovery tool. Laravel supplies the published registry to both Inertia pages. The catalogue searches English and localized metadata in memory. Its URL-backed Browse filters and its dialog share the matcher.

The reusable React dialog accepts results through a search function and reports the selected item to its host. It handles modal focus, dismissal and keyboard selection. The shell registers the global shortcut and opens the selected entry through Inertia. A second host in the download demonstrates the same component with fictional data and a different selection action.

This sends a small list with each page visit and keeps search available without another HTTP request. A large or permission-dependent catalogue would warrant revisiting which records the server sends.
