# JPA CLI - Sandbox Demo
# Run this to see all CLI commands in action
# No global install needed - runs from node dist/index.js directly

$CLI = "node $PSScriptRoot\..\dist\index.js"
$SANDBOX = "$PSScriptRoot\test-project"
$SEPARATOR = "=" * 70

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  JPA CLI - Sandbox Demo" -ForegroundColor Cyan
Write-Host "  Running from dist/ - no global install required" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Clean & create test project
if (Test-Path $SANDBOX) { Remove-Item -Recurse -Force $SANDBOX }
New-Item -ItemType Directory -Force -Path $SANDBOX | Out-Null
Set-Location $SANDBOX
Write-Host "Created sandbox project at: $SANDBOX" -ForegroundColor Green
Write-Host ""

# ─── 1. VERSION & HELP ────────────────────────────────────
Write-Host $SEPARATOR -ForegroundColor Cyan
Write-Host " [1/10] CLI Version & Help Menu" -ForegroundColor Yellow
Write-Host $SEPARATOR -ForegroundColor Cyan
Invoke-Expression "$CLI --version"
Write-Host ""
Write-Host "Top-level help:" -ForegroundColor Green
Invoke-Expression "$CLI --help"
Write-Host ""

# ─── 2. SUBCOMMAND HELP ──────────────────────────────────
Write-Host $SEPARATOR -ForegroundColor Cyan
Write-Host " [2/10] Subcommand Help Menus" -ForegroundColor Yellow
Write-Host $SEPARATOR -ForegroundColor Cyan
Write-Host "--- agent ---" -ForegroundColor Green
Invoke-Expression "$CLI agent --help"
Write-Host ""
Write-Host "--- rules ---" -ForegroundColor Green
Invoke-Expression "$CLI rules --help"
Write-Host ""
Write-Host "--- mcp ---" -ForegroundColor Green
Invoke-Expression "$CLI mcp --help"
Write-Host ""
Write-Host "--- skills ---" -ForegroundColor Green
Invoke-Expression "$CLI skills --help"
Write-Host ""

# ─── 3. DETECT ───────────────────────────────────────────
Write-Host $SEPARATOR -ForegroundColor Cyan
Write-Host " [3/10] Workspace Detection" -ForegroundColor Yellow
Write-Host $SEPARATOR -ForegroundColor Cyan
# Create some dummy rule files for detection
New-Item -ItemType Directory -Force -Path ".git" | Out-Null
New-Item -ItemType Directory -Force -Path ".vscode" | Out-Null
"# Cursor Rules" | Out-File -Encoding ASCII ".cursorrules"
"# Claude Config" | Out-File -Encoding ASCII ".claudecoderc"
Invoke-Expression "$CLI detect"
Write-Host ""

# ─── 4. AGENT LIST ──────────────────────────────────────
Write-Host $SEPARATOR -ForegroundColor Cyan
Write-Host " [4/10] Agent List (21 supported agents)" -ForegroundColor Yellow
Write-Host $SEPARATOR -ForegroundColor Cyan
Invoke-Expression "$CLI agent list"
Write-Host ""

# ─── 5. AGENT INSTALL ───────────────────────────────────
Write-Host $SEPARATOR -ForegroundColor Cyan
Write-Host " [5/10] Agent Install (cursor)" -ForegroundColor Yellow
Write-Host $SEPARATOR -ForegroundColor Cyan
Invoke-Expression "$CLI agent install cursor"
Write-Host ""

# ─── 6. RULES LIST ──────────────────────────────────────
Write-Host $SEPARATOR -ForegroundColor Cyan
Write-Host " [6/10] Rules List & View" -ForegroundColor Yellow
Write-Host $SEPARATOR -ForegroundColor Cyan
Invoke-Expression "$CLI rules list"
Write-Host ""
Write-Host "--- Rules View (.cursorrules) ---" -ForegroundColor Green
Invoke-Expression "$CLI rules view .cursorrules"
Write-Host ""

# ─── 7. RULES TEMPLATE ─────────────────────────────────
Write-Host $SEPARATOR -ForegroundColor Cyan
Write-Host " [7/10] Rules Template Generation" -ForegroundColor Yellow
Write-Host $SEPARATOR -ForegroundColor Cyan
# Create temp project for template save test
$templateDir = "$PSScriptRoot\template-test"
if (Test-Path $templateDir) { Remove-Item -Recurse -Force $templateDir }
New-Item -ItemType Directory -Force -Path $templateDir | Out-Null
Push-Location $templateDir
Write-Host "Generating CLAUDE.md template..." -ForegroundColor Green
Invoke-Expression "$CLI rules template CLAUDE.md" | Out-Null
# Actually simulate with --help since template is interactive
Invoke-Expression "$CLI rules template --help"
Pop-Location
Write-Host ""

# ─── 8. RULES BACKUP ────────────────────────────────────
Write-Host $SEPARATOR -ForegroundColor Cyan
Write-Host " [8/10] Rules Backup" -ForegroundColor Yellow
Write-Host $SEPARATOR -ForegroundColor Cyan
Set-Location $SANDBOX
Invoke-Expression "$CLI rules backup"
Write-Host ""

# ─── 9. STATUS ──────────────────────────────────────────
Write-Host $SEPARATOR -ForegroundColor Cyan
Write-Host " [9/10] System Status" -ForegroundColor Yellow
Write-Host $SEPARATOR -ForegroundColor Cyan
Invoke-Expression "$CLI status"
Write-Host ""

# ─── 10. KEYS ───────────────────────────────────────────
Write-Host $SEPARATOR -ForegroundColor Cyan
Write-Host " [10/10] Keys Management" -ForegroundColor Yellow
Write-Host $SEPARATOR -ForegroundColor Cyan
Invoke-Expression "$CLI keys --help"
Write-Host ""

# ─── CLEANUP ────────────────────────────────────────────
Set-Location $PSScriptRoot
if (Test-Path $SANDBOX) { Remove-Item -Recurse -Force $SANDBOX }
if (Test-Path "$PSScriptRoot\template-test") { Remove-Item -Recurse -Force "$PSScriptRoot\template-test" }

Write-Host $SEPARATOR -ForegroundColor Cyan
Write-Host "  DEMO COMPLETE" -ForegroundColor Green
Write-Host $SEPARATOR -ForegroundColor Cyan
Write-Host ""
Write-Host "Commands demonstrated:" -ForegroundColor Yellow
Write-Host "  jpa-cli --version" -ForegroundColor White
Write-Host "  jpa-cli --help" -ForegroundColor White
Write-Host "  jpa-cli <command> --help  (agent, rules, mcp, skills)" -ForegroundColor White
Write-Host "  jpa-cli detect" -ForegroundColor White
Write-Host "  jpa-cli status" -ForegroundColor White
Write-Host "  jpa-cli agent list" -ForegroundColor White
Write-Host "  jpa-cli agent install <name>" -ForegroundColor White
Write-Host "  jpa-cli rules list" -ForegroundColor White
Write-Host "  jpa-cli rules view <file>" -ForegroundColor White
Write-Host "  jpa-cli rules backup" -ForegroundColor White
Write-Host "  jpa-cli keys" -ForegroundColor White
Write-Host ""
Write-Host "To run manually:" -ForegroundColor Yellow
Write-Host "  node dist/index.js <command>" -ForegroundColor White
Write-Host "  bin\jpa-cli-win-x64.exe <command>" -ForegroundColor White
Write-Host ""
