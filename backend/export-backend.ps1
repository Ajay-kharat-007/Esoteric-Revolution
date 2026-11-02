$Root = (Get-Location).Path
$ExportFolder = Join-Path $Root "ESOTERIC_BACKEND_EXPORT_LATEST"

Remove-Item $ExportFolder -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $ExportFolder -Force | Out-Null

$ExcludedFolders = @(
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    ".angular",
    ".next",
    ".idea",
    ".vscode",
    "uploads",
    "logs",
    "tmp",
    "temp",
    "src\generated",
    "ESOTERIC_BACKEND_EXPORT",
    "ESOTERIC_BACKEND_EXPORT_FIXED",
    "ESOTERIC_BACKEND_EXPORT_LATEST",
    "Phase-2.1-RBAC-Conversion-Package",
    "API-CONTRACT-FIX-PACKAGE"
)

$AllowedExtensions = @(
    ".ts", ".js", ".cjs", ".mjs",
    ".json", ".sql", ".prisma",
    ".yml", ".yaml",
    ".md", ".txt",
    ".graphql", ".gql",
    ".sh", ".ps1",
    ".properties", ".xml"
)

$ExcludedFileNames = @(
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "OPENAPI.json",
    "PHASE-2.0-BASELINE-RESULT.txt",
    "PHASE-2.2A-API-CONTRACT-RESULT.txt"
)

$Files = Get-ChildItem -Path $Root -Recurse -File | Where-Object {
    $File = $_
    $RelativePath = $File.FullName.Substring($Root.Length).TrimStart("\")

    $Allowed = $AllowedExtensions -contains $File.Extension.ToLower()
    $ExcludedName = $ExcludedFileNames -contains $File.Name
    $SecretFile = $File.Name -like ".env*"
    $ExcludedPath = $false

    foreach ($Folder in $ExcludedFolders) {
        if (
            $RelativePath -like "$Folder\*" -or
            $RelativePath -like "*\$Folder\*"
        ) {
            $ExcludedPath = $true
            break
        }
    }

    $BackupFolder = $RelativePath -match "(^|\\)\.phase-.*-backup-"
    $ContractBackup = $RelativePath -match "(^|\\)\.api-contract-backup-"

    $Allowed -and
    -not $ExcludedName -and
    -not $SecretFile -and
    -not $ExcludedPath -and
    -not $BackupFolder -and
    -not $ContractBackup
} | Sort-Object FullName

if ($Files.Count -eq 0) {
    throw "No backend source files found."
}

$TotalBytes = ($Files | Measure-Object Length -Sum).Sum
$TargetBytesPerPart = [Math]::Ceiling($TotalBytes / 3)

$OutputFiles = @(
    Join-Path $ExportFolder "ESOTERIC_BACKEND_PART_1.txt"
    Join-Path $ExportFolder "ESOTERIC_BACKEND_PART_2.txt"
    Join-Path $ExportFolder "ESOTERIC_BACKEND_PART_3.txt"
)

$PartIndex = 0
$CurrentPartBytes = 0
$ExportedCount = 0
$ReadErrors = 0

foreach ($File in $Files) {
    if (
        $PartIndex -lt 2 -and
        $CurrentPartBytes -ge $TargetBytesPerPart
    ) {
        $PartIndex++
        $CurrentPartBytes = 0
    }

    $RelativePath = $File.FullName.Substring($Root.Length).TrimStart("\")

    $Header = @"

================================================================================
FILE: $RelativePath
SIZE: $($File.Length) bytes
================================================================================

"@

    try {
        $Content = [System.IO.File]::ReadAllText($File.FullName)

        [System.IO.File]::AppendAllText(
            $OutputFiles[$PartIndex],
            $Header + $Content + "`r`n",
            [System.Text.UTF8Encoding]::new($false)
        )

        $CurrentPartBytes += $File.Length
        $ExportedCount++
    }
    catch {
        $ErrorText = @"

================================================================================
FILE: $RelativePath
READ ERROR: $($_.Exception.Message)
================================================================================

"@

        [System.IO.File]::AppendAllText(
            $OutputFiles[$PartIndex],
            $ErrorText,
            [System.Text.UTF8Encoding]::new($false)
        )

        $ReadErrors++
    }
}

$Manifest = @"
ESOTERIC BACKEND EXPORT

Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Project root: $Root
Files discovered: $($Files.Count)
Files exported: $ExportedCount
Read errors: $ReadErrors
Total source size: $TotalBytes bytes

Excluded:
- Environment and secret files
- Dependencies
- Build output
- Generated Prisma client
- Previous exports
- Backup folders
- Package archives
- Lock files
"@

$Manifest | Set-Content `
    (Join-Path $ExportFolder "EXPORT_MANIFEST.txt") `
    -Encoding UTF8

Write-Host ""
Write-Host "Backend export completed." -ForegroundColor Green
Write-Host "Files exported: $ExportedCount"
Write-Host "Read errors: $ReadErrors"
Write-Host ""

Get-ChildItem $ExportFolder |
    Select-Object Name, Length |
    Format-Table -AutoSize