# Phase A1.3 Admin Login

Run from Angular frontend root:

```powershell
Expand-Archive ".\Phase-A1.3-Admin-Login.zip" ".\Phase-A1.3-Admin-Login" -Force
powershell -ExecutionPolicy Bypass -File ".\Phase-A1.3-Admin-Login\phase-a1.3-admin-login\INSTALL.ps1"
```

Implements the responsive Admin login page with real backend integration, `/me` Admin verification, safe return URL, errors, loading state, route guard, placeholder protected dashboard, and tests.
