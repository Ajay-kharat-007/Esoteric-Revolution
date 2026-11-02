# Phase A1.2 Frontend Auth Alignment

Run from the Angular frontend root:

```powershell
Expand-Archive ".\Phase-A1.2-Frontend-Auth-Alignment.zip" ".\Phase-A1.2-Frontend-Auth-Alignment" -Force
powershell -ExecutionPolicy Bypass -File ".\Phase-A1.2-Frontend-Auth-Alignment\phase-a1.2-frontend-auth-alignment\INSTALL.ps1"
```

Aligns the existing auth foundation with the Esoteric backend: identifier/password login, rotated refresh tokens, `/me` normalization, Admin role enforcement, restoration, logout, sessions, password recovery contracts, and backend error shape. No pages or visual components are added.
