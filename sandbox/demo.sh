#!/usr/bin/env bash
# JPA CLI - Sandbox Demo (Bash/Unix version)
# Run this to see all CLI commands in action via Docker or direct node
# Usage: bash sandbox/demo.sh

set -e
CLI="node $(dirname "$0")/../dist/index.js"
SANDBOX="/tmp/jpa-cli-sandbox"
SEPARATOR="================================================================"

echo -e "\033[36m$SEPARATOR\033[0m"
echo -e "\033[36m  JPA CLI - Sandbox Demo\033[0m"
echo -e "\033[36m  Running from dist/ - no global install required\033[0m"
echo -e "\033[36m$SEPARATOR\033[0m"
echo ""

# Clean & create test project
rm -rf "$SANDBOX" 2>/dev/null
mkdir -p "$SANDBOX"
cd "$SANDBOX"
echo -e "\033[32mCreated sandbox project at: $SANDBOX\033[0m"
echo ""

# ─── 1. VERSION & HELP ────────────────────────────────
echo -e "\033[36m$SEPARATOR\033[0m"
echo -e "\033[33m [1/10] CLI Version & Help Menu\033[0m"
echo -e "\033[36m$SEPARATOR\033[0m"
$CLI --version
echo ""
echo -e "\033[32mTop-level help:\033[0m"
$CLI --help
echo ""

# ─── 2. SUBCOMMAND HELP ──────────────────────────────
echo -e "\033[36m$SEPARATOR\033[0m"
echo -e "\033[33m [2/10] Subcommand Help Menus\033[0m"
echo -e "\033[36m$SEPARATOR\033[0m"
echo -e "\033[32m--- agent ---\033[0m"
$CLI agent --help
echo ""
echo -e "\033[32m--- rules ---\033[0m"
$CLI rules --help
echo ""
echo -e "\033[32m--- mcp ---\033[0m"
$CLI mcp --help
echo ""
echo -e "\033[32m--- skills ---\033[0m"
$CLI skills --help
echo ""

# ─── 3. DETECT ───────────────────────────────────────
echo -e "\033[36m$SEPARATOR\033[0m"
echo -e "\033[33m [3/10] Workspace Detection\033[0m"
echo -e "\033[36m$SEPARATOR\033[0m"
mkdir -p .git .vscode
echo "# Cursor Rules" > .cursorrules
echo "# Claude Config" > .claudecoderc
$CLI detect
echo ""

# ─── 4. AGENT LIST ───────────────────────────────────
echo -e "\033[36m$SEPARATOR\033[0m"
echo -e "\033[33m [4/10] Agent List (21 supported agents)\033[0m"
echo -e "\033[36m$SEPARATOR\033[0m"
$CLI agent list
echo ""

# ─── 5. AGENT INSTALL ────────────────────────────────
echo -e "\033[36m$SEPARATOR\033[0m"
echo -e "\033[33m [5/10] Agent Install (cursor)\033[0m"
echo -e "\033[36m$SEPARATOR\033[0m"
$CLI agent install cursor
echo ""

# ─── 6. RULES ────────────────────────────────────────
echo -e "\033[36m$SEPARATOR\033[0m"
echo -e "\033[33m [6/10] Rules List & View\033[0m"
echo -e "\033[36m$SEPARATOR\033[0m"
$CLI rules list
echo ""
echo -e "\033[32m--- Rules View (.cursorrules) ---\033[0m"
$CLI rules view .cursorrules
echo ""

# ─── 7. RULES BACKUP ─────────────────────────────────
echo -e "\033[36m$SEPARATOR\033[0m"
echo -e "\033[33m [7/10] Rules Backup\033[0m"
echo -e "\033[36m$SEPARATOR\033[0m"
$CLI rules backup
echo ""

# ─── 8. STATUS ───────────────────────────────────────
echo -e "\033[36m$SEPARATOR\033[0m"
echo -e "\033[33m [8/10] System Status\033[0m"
echo -e "\033[36m$SEPARATOR\033[0m"
$CLI status
echo ""

# ─── 9. UPDATE CHECK ─────────────────────────────────
echo -e "\033[36m$SEPARATOR\033[0m"
echo -e "\033[33m [9/10] Update Check\033[0m"
echo -e "\033[36m$SEPARATOR\033[0m"
$CLI update --help
echo ""

# ─── 10. KEYS ────────────────────────────────────────
echo -e "\033[36m$SEPARATOR\033[0m"
echo -e "\033[33m [10/10] Keys Management\033[0m"
echo -e "\033[36m$SEPARATOR\033[0m"
$CLI keys --help
echo ""

# ─── CLEANUP ─────────────────────────────────────────
cd /tmp
rm -rf "$SANDBOX"

echo -e "\033[36m$SEPARATOR\033[0m"
echo -e "\033[32m  DEMO COMPLETE\033[0m"
echo -e "\033[36m$SEPARATOR\033[0m"
echo ""
echo -e "\033[33mTo run manually:\033[0m"
echo -e "  \033[37mnode dist/index.js <command>\033[0m"
echo -e "  \033[37mbin/jpa-cli-linux-x64 <command>\033[0m"
echo ""
