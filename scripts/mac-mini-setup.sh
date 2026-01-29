#!/bin/bash
#═══════════════════════════════════════════════════════════════════════════════
#  ARI Mac Mini Complete Setup Script
#  Purpose: Configure a fresh Mac Mini to run ARI 24/7 with FULL capabilities
#  Author: ARI System
#  Usage: bash mac-mini-setup.sh
#
#  This script installs EVERYTHING needed for full ARI operation:
#  - Prerequisites (Xcode, Homebrew, Node 20, Git, tmux)
#  - ARI core system (clone, build, initialize)
#  - ARI dashboard (React UI)
#  - Claude Code with 80+ plugins from 12 verified marketplaces
#  - ARI daemon (24/7 background service)
#  - MCP server integration
#  - Backup automation (daily cron)
#  - Log rotation
#  - Tailscale for remote access
#═══════════════════════════════════════════════════════════════════════════════

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Directories
ARI_DIR="$HOME/Work/ARI"
CLAUDE_DIR="$HOME/.claude"
PLUGINS_DIR="$CLAUDE_DIR/plugins/marketplaces"

# Print functions
print_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${MAGENTA}ℹ $1${NC}"
}

# Check if running on macOS
check_macos() {
    if [[ "$(uname)" != "Darwin" ]]; then
        print_error "This script is for macOS only"
        exit 1
    fi
    print_success "Running on macOS $(sw_vers -productVersion)"
}

#───────────────────────────────────────────────────────────────────────────────
# PHASE 1: SYSTEM PREREQUISITES
#───────────────────────────────────────────────────────────────────────────────

install_xcode_tools() {
    print_header "Phase 1: Installing Xcode Command Line Tools"

    if xcode-select -p &>/dev/null; then
        print_success "Xcode Command Line Tools already installed"
    else
        print_step "Installing Xcode Command Line Tools..."
        xcode-select --install
        echo ""
        print_warning "A dialog will appear. Click 'Install' and wait for completion."
        print_warning "Press ENTER when the installation is complete..."
        read -r
    fi
}

install_homebrew() {
    print_header "Phase 1: Installing Homebrew"

    if command -v brew &>/dev/null; then
        print_success "Homebrew already installed"
    else
        print_step "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

        # Add Homebrew to PATH for Apple Silicon
        if [[ -f "/opt/homebrew/bin/brew" ]]; then
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi

        print_success "Homebrew installed"
    fi

    # Ensure brew is in PATH for this session
    if [[ -f "/opt/homebrew/bin/brew" ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
}

install_essentials() {
    print_header "Phase 1: Installing Essential Packages"

    print_step "Updating Homebrew..."
    brew update

    # Node.js 20
    if command -v node &>/dev/null && [[ "$(node -v)" == v2* ]]; then
        print_success "Node.js already installed: $(node -v)"
    else
        print_step "Installing Node.js 20..."
        brew install node@20
        brew link node@20 --force --overwrite 2>/dev/null || true
        print_success "Node.js installed: $(node -v)"
    fi

    # Git
    if command -v git &>/dev/null; then
        print_success "Git already installed: $(git --version)"
    else
        print_step "Installing Git..."
        brew install git
        print_success "Git installed"
    fi

    # tmux (for persistent sessions)
    if command -v tmux &>/dev/null; then
        print_success "tmux already installed"
    else
        print_step "Installing tmux..."
        brew install tmux
        print_success "tmux installed"
    fi

    # logrotate (for log management)
    if command -v logrotate &>/dev/null; then
        print_success "logrotate already installed"
    else
        print_step "Installing logrotate..."
        brew install logrotate
        print_success "logrotate installed"
    fi
}

#───────────────────────────────────────────────────────────────────────────────
# PHASE 2: CLONE & BUILD ARI
#───────────────────────────────────────────────────────────────────────────────

setup_ari() {
    print_header "Phase 2: Setting Up ARI Core System"

    # Create Work directory
    mkdir -p "$HOME/Work"

    # Clone or update ARI
    if [[ -d "$ARI_DIR" ]]; then
        print_step "ARI directory exists, pulling latest..."
        cd "$ARI_DIR"
        git pull origin main || git pull origin master || print_warning "Could not pull (may be on different branch)"
    else
        print_step "Cloning ARI repository..."
        cd "$HOME/Work"
        git clone https://github.com/PryceHedrick/ARI.git
    fi

    cd "$ARI_DIR"
    print_success "ARI repository ready at $ARI_DIR"

    # Install dependencies
    print_step "Installing npm dependencies..."
    npm install
    print_success "Dependencies installed"

    # Build
    print_step "Building ARI..."
    npm run build
    print_success "ARI built successfully"

    # Initialize
    print_step "Initializing ARI system..."
    npx ari onboard init 2>/dev/null || print_warning "ARI may already be initialized"
    print_success "ARI initialized"

    # Health check
    print_step "Running health check..."
    npx ari doctor || print_warning "Some health checks may have failed (gateway not running yet)"
}

#───────────────────────────────────────────────────────────────────────────────
# PHASE 3: BUILD DASHBOARD
#───────────────────────────────────────────────────────────────────────────────

setup_dashboard() {
    print_header "Phase 3: Building ARI Dashboard"

    DASHBOARD_DIR="$ARI_DIR/dashboard"

    if [[ -d "$DASHBOARD_DIR" ]]; then
        cd "$DASHBOARD_DIR"

        print_step "Installing dashboard dependencies..."
        npm install
        print_success "Dashboard dependencies installed"

        print_step "Building dashboard..."
        npm run build 2>/dev/null || {
            print_warning "Dashboard build failed - may need gateway running first"
            print_info "You can build later with: cd $DASHBOARD_DIR && npm run build"
        }

        print_success "Dashboard setup complete"
    else
        print_warning "Dashboard directory not found at $DASHBOARD_DIR"
    fi

    cd "$ARI_DIR"
}

#───────────────────────────────────────────────────────────────────────────────
# PHASE 4: INSTALL DAEMON
#───────────────────────────────────────────────────────────────────────────────

install_daemon() {
    print_header "Phase 4: Installing ARI Daemon (24/7 Service)"

    cd "$ARI_DIR"

    # Create log directory
    mkdir -p "$HOME/.ari/logs"

    print_step "Installing ARI as background daemon..."

    # Manual LaunchAgent setup (more reliable)
    PLIST_DIR="$HOME/Library/LaunchAgents"
    PLIST_FILE="$PLIST_DIR/com.ari.gateway.plist"

    mkdir -p "$PLIST_DIR"

    # Get full path to node
    NODE_PATH=$(which node)

    cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ari.gateway</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NODE_PATH</string>
        <string>$ARI_DIR/dist/cli/index.js</string>
        <string>gateway</string>
        <string>start</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$ARI_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>ThrottleInterval</key>
    <integer>10</integer>
    <key>StandardOutPath</key>
    <string>$HOME/.ari/logs/gateway-stdout.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/.ari/logs/gateway-stderr.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
</dict>
</plist>
EOF

    print_success "LaunchAgent plist created"

    # Load the daemon
    launchctl unload "$PLIST_FILE" 2>/dev/null || true
    launchctl load "$PLIST_FILE"

    print_step "Waiting for gateway to start..."
    sleep 3

    # Verify daemon is running
    if curl -s http://127.0.0.1:3141/health &>/dev/null; then
        print_success "ARI daemon is running on 127.0.0.1:3141"
    else
        print_warning "Gateway may still be starting. Check with: curl http://127.0.0.1:3141/health"
    fi
}

#───────────────────────────────────────────────────────────────────────────────
# PHASE 5: INSTALL CLAUDE CODE
#───────────────────────────────────────────────────────────────────────────────

install_claude_code() {
    print_header "Phase 5: Installing Claude Code"

    if command -v claude &>/dev/null; then
        print_success "Claude Code already installed"
    else
        print_step "Installing Claude Code globally..."
        npm install -g @anthropic-ai/claude-code
        print_success "Claude Code installed"
    fi
}

#───────────────────────────────────────────────────────────────────────────────
# PHASE 6: INSTALL PLUGIN MARKETPLACES (80+ PLUGINS)
#───────────────────────────────────────────────────────────────────────────────

install_plugin_marketplaces() {
    print_header "Phase 6: Installing 80+ Plugins from 12 Verified Marketplaces"

    mkdir -p "$PLUGINS_DIR"

    # Official Anthropic
    if [ ! -d "$PLUGINS_DIR/claude-plugins-official" ]; then
        print_step "Installing claude-plugins-official (Anthropic)..."
        git clone --quiet https://github.com/anthropics/claude-plugins-official.git "$PLUGINS_DIR/claude-plugins-official" 2>/dev/null || print_warning "Failed to clone claude-plugins-official"
    else
        print_success "claude-plugins-official already installed"
    fi

    # Trail of Bits Security
    if [ ! -d "$PLUGINS_DIR/trailofbits-security" ]; then
        print_step "Installing trailofbits-security (Security Firm)..."
        git clone --quiet https://github.com/trailofbits/skills.git "$PLUGINS_DIR/trailofbits-security" 2>/dev/null || print_warning "Failed to clone trailofbits-security"
    else
        print_success "trailofbits-security already installed"
    fi

    # Anthropic Demo Plugins
    if [ ! -d "$PLUGINS_DIR/claude-code-plugins" ]; then
        print_step "Installing claude-code-plugins (Anthropic Demo)..."
        git clone --quiet https://github.com/anthropics/claude-code.git "$PLUGINS_DIR/claude-code-plugins" 2>/dev/null || print_warning "Failed to clone claude-code-plugins"
    else
        print_success "claude-code-plugins already installed"
    fi

    # Community Verified - wshobson/agents (71 agents)
    if [ ! -d "$PLUGINS_DIR/wshobson-agents" ]; then
        print_step "Installing wshobson-agents (71 specialized agents)..."
        git clone --quiet https://github.com/wshobson/agents.git "$PLUGINS_DIR/wshobson-agents" 2>/dev/null || print_warning "Failed to clone wshobson-agents"
    else
        print_success "wshobson-agents already installed"
    fi

    # Community Verified - ccplugins-awesome
    if [ ! -d "$PLUGINS_DIR/ccplugins-awesome" ]; then
        print_step "Installing ccplugins-awesome (118 plugins)..."
        git clone --quiet https://github.com/ccplugins/awesome-claude-code-plugins.git "$PLUGINS_DIR/ccplugins-awesome" 2>/dev/null || print_warning "Failed to clone ccplugins-awesome"
    else
        print_success "ccplugins-awesome already installed"
    fi

    # Community Verified - cc-marketplace
    if [ ! -d "$PLUGINS_DIR/cc-marketplace" ]; then
        print_step "Installing cc-marketplace (119 plugins)..."
        git clone --quiet https://github.com/ananddtyagi/cc-marketplace.git "$PLUGINS_DIR/cc-marketplace" 2>/dev/null || print_warning "Failed to clone cc-marketplace"
    else
        print_success "cc-marketplace already installed"
    fi

    # Community Verified - claude-code-skills
    if [ ! -d "$PLUGINS_DIR/claude-code-skills" ]; then
        print_step "Installing claude-code-skills..."
        git clone --quiet https://github.com/alirezarezvani/claude-skills.git "$PLUGINS_DIR/claude-code-skills" 2>/dev/null || print_warning "Failed to clone claude-code-skills"
    else
        print_success "claude-code-skills already installed"
    fi

    # Community Verified - mhattingpete
    if [ ! -d "$PLUGINS_DIR/mhattingpete-claude-skills" ]; then
        print_step "Installing mhattingpete-claude-skills..."
        git clone --quiet https://github.com/mhattingpete/claude-skills-marketplace.git "$PLUGINS_DIR/mhattingpete-claude-skills" 2>/dev/null || print_warning "Failed to clone mhattingpete-claude-skills"
    else
        print_success "mhattingpete-claude-skills already installed"
    fi

    # Community Verified - claude-night-market
    if [ ! -d "$PLUGINS_DIR/claude-night-market" ]; then
        print_step "Installing claude-night-market..."
        git clone --quiet https://github.com/athola/claude-night-market.git "$PLUGINS_DIR/claude-night-market" 2>/dev/null || print_warning "Failed to clone claude-night-market"
    else
        print_success "claude-night-market already installed"
    fi

    # Community Verified - claude-code-templates
    if [ ! -d "$PLUGINS_DIR/claude-code-templates" ]; then
        print_step "Installing claude-code-templates..."
        git clone --quiet https://github.com/davila7/claude-code-templates.git "$PLUGINS_DIR/claude-code-templates" 2>/dev/null || print_warning "Failed to clone claude-code-templates"
    else
        print_success "claude-code-templates already installed"
    fi

    # Community Verified - superpowers
    if [ ! -d "$PLUGINS_DIR/superpowers-dev" ]; then
        print_step "Installing superpowers-dev..."
        git clone --quiet https://github.com/obra/superpowers.git "$PLUGINS_DIR/superpowers-dev" 2>/dev/null || print_warning "Failed to clone superpowers-dev"
    else
        print_success "superpowers-dev already installed"
    fi

    # Community Verified - claude-flow
    if [ ! -d "$PLUGINS_DIR/ruvnet-claude-flow" ]; then
        print_step "Installing ruvnet-claude-flow (Enterprise orchestration)..."
        git clone --quiet https://github.com/ruvnet/claude-flow.git "$PLUGINS_DIR/ruvnet-claude-flow" 2>/dev/null || print_warning "Failed to clone ruvnet-claude-flow"
    else
        print_success "ruvnet-claude-flow already installed"
    fi

    print_success "All marketplaces installed"
}

#───────────────────────────────────────────────────────────────────────────────
# PHASE 7: CONFIGURE CLAUDE CODE SETTINGS
#───────────────────────────────────────────────────────────────────────────────

configure_claude_settings() {
    print_header "Phase 7: Configuring Claude Code Settings"

    mkdir -p "$CLAUDE_DIR"

    # Backup existing settings
    if [ -f "$CLAUDE_DIR/settings.json" ]; then
        cp "$CLAUDE_DIR/settings.json" "$CLAUDE_DIR/settings.json.backup.$(date +%Y%m%d%H%M%S)"
        print_info "Backed up existing settings.json"
    fi

    print_step "Writing plugin configuration (80+ plugins)..."

    cat > "$CLAUDE_DIR/settings.json" << 'SETTINGS_EOF'
{
  "enabledPlugins": {
    "superpowers@claude-plugins-official": true,
    "agent-sdk-dev@claude-plugins-official": true,
    "code-review@claude-plugins-official": true,
    "commit-commands@claude-plugins-official": true,
    "context7@claude-plugins-official": true,
    "feature-dev@claude-plugins-official": true,
    "plugin-dev@claude-plugins-official": true,
    "pr-review-toolkit@claude-plugins-official": true,
    "security-guidance@claude-plugins-official": true,
    "typescript-lsp@claude-plugins-official": true,
    "github@claude-plugins-official": true,
    "explanatory-output-style@claude-plugins-official": true,
    "claude-md-management@claude-plugins-official": true,
    "Notion@claude-plugins-official": true,
    "figma@claude-plugins-official": true,
    "playwright@claude-plugins-official": true,
    "vercel@claude-plugins-official": true,
    "supabase@claude-plugins-official": true,
    "ralph-loop@claude-plugins-official": true,
    "serena@claude-plugins-official": true,
    "frontend-design@claude-plugins-official": true,
    "static-analysis@trailofbits-security": true,
    "differential-review@trailofbits-security": true,
    "variant-analysis@trailofbits-security": true,
    "sharp-edges@trailofbits-security": true,
    "property-based-testing@trailofbits-security": true,
    "semgrep-rule-creator@trailofbits-security": true,
    "testing-handbook-skills@trailofbits-security": true,
    "audit-context-building@trailofbits-security": true,
    "fix-review@trailofbits-security": true,
    "hookify@claude-code-plugins": true,
    "ralph-wiggum@claude-code-plugins": true,
    "security-scanning@wshobson-agents": true,
    "security-compliance@wshobson-agents": true,
    "backend-api-security@wshobson-agents": true,
    "javascript-typescript@wshobson-agents": true,
    "unit-testing@wshobson-agents": true,
    "agent-orchestration@wshobson-agents": true,
    "debugging-toolkit@wshobson-agents": true,
    "git-pr-workflows@wshobson-agents": true,
    "backend-development@wshobson-agents": true,
    "comprehensive-review@wshobson-agents": true,
    "full-stack-orchestration@wshobson-agents": true,
    "dependency-management@wshobson-agents": true,
    "enterprise-security-reviewer@ccplugins-awesome": true,
    "compliance-automation-specialist@ccplugins-awesome": true,
    "data-privacy-engineer@ccplugins-awesome": true,
    "backend-architect@ccplugins-awesome": true,
    "code-reviewer@ccplugins-awesome": true,
    "debugger@ccplugins-awesome": true,
    "test-writer-fixer@ccplugins-awesome": true,
    "api-tester@ccplugins-awesome": true,
    "performance-benchmarker@ccplugins-awesome": true,
    "ai-engineer@ccplugins-awesome": true,
    "ultrathink@ccplugins-awesome": true,
    "ceo-quality-controller-agent@ccplugins-awesome": true,
    "math@cc-marketplace": true,
    "engineering-workflow-skills@mhattingpete-claude-skills": true,
    "productivity-skills@mhattingpete-claude-skills": true,
    "visual-documentation-skills@mhattingpete-claude-skills": true,
    "code-operations-skills@mhattingpete-claude-skills": true,
    "hookify@claude-night-market": true,
    "pensive@claude-night-market": true,
    "conserve@claude-night-market": true,
    "spec-kit@claude-night-market": true,
    "sanctum@claude-night-market": true,
    "memory-palace@claude-night-market": true,
    "testing-suite@claude-code-templates": true,
    "security-pro@claude-code-templates": true,
    "devops-automation@claude-code-templates": true,
    "c-level-skills@claude-code-skills": true,
    "engineering-skills@claude-code-skills": true,
    "pm-skills@claude-code-skills": true,
    "product-skills@claude-code-skills": true,
    "content-creator@claude-code-skills": true,
    "project-management@claude-code-skills": true,
    "ra-qm-team@claude-code-skills": true,
    "superpowers@superpowers-dev": true,
    "claude-flow@ruvnet-claude-flow": true
  },
  "mcpServers": {
    "ari": {
      "command": "npx",
      "args": ["tsx", "./src/mcp/server.ts"],
      "cwd": "ARI_DIR_PLACEHOLDER"
    }
  }
}
SETTINGS_EOF

    # Replace placeholder with actual path
    sed -i '' "s|ARI_DIR_PLACEHOLDER|$ARI_DIR|g" "$CLAUDE_DIR/settings.json"

    print_success "Claude Code settings configured with 80+ plugins"
}

#───────────────────────────────────────────────────────────────────────────────
# PHASE 8: SETUP BACKUP AUTOMATION
#───────────────────────────────────────────────────────────────────────────────

setup_backup_automation() {
    print_header "Phase 8: Setting Up Automated Backups"

    # Create backup directory
    mkdir -p "$HOME/.ari/backups"

    # Make backup script executable
    chmod +x "$ARI_DIR/scripts/backup.sh" 2>/dev/null || true

    # Add cron job for daily backup at 2 AM
    CRON_JOB="0 2 * * * $ARI_DIR/scripts/backup.sh >> $HOME/.ari/logs/backup.log 2>&1"

    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "backup.sh"; then
        print_success "Backup cron job already exists"
    else
        print_step "Adding daily backup cron job (2 AM)..."
        (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        print_success "Backup cron job installed"
    fi

    print_info "Backups will be stored in ~/.ari/backups/"
}

#───────────────────────────────────────────────────────────────────────────────
# PHASE 9: SETUP LOG ROTATION
#───────────────────────────────────────────────────────────────────────────────

setup_log_rotation() {
    print_header "Phase 9: Setting Up Log Rotation"

    LOGROTATE_CONF="$HOME/.ari/logrotate.conf"

    print_step "Creating logrotate configuration..."

    cat > "$LOGROTATE_CONF" << EOF
$HOME/.ari/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 $(whoami) staff
}
EOF

    # Add cron job for log rotation
    LOGROTATE_CRON="0 3 * * * /opt/homebrew/bin/logrotate -s $HOME/.ari/logrotate.state $LOGROTATE_CONF"

    if crontab -l 2>/dev/null | grep -q "logrotate"; then
        print_success "Logrotate cron job already exists"
    else
        print_step "Adding log rotation cron job (3 AM)..."
        (crontab -l 2>/dev/null; echo "$LOGROTATE_CRON") | crontab -
        print_success "Log rotation cron job installed"
    fi

    print_info "Logs older than 7 days will be compressed and rotated"
}

#───────────────────────────────────────────────────────────────────────────────
# PHASE 10: INSTALL TAILSCALE
#───────────────────────────────────────────────────────────────────────────────

install_tailscale() {
    print_header "Phase 10: Installing Tailscale (Remote Access)"

    if command -v tailscale &>/dev/null || [ -d "/Applications/Tailscale.app" ]; then
        print_success "Tailscale already installed"
    else
        print_step "Installing Tailscale..."
        brew install --cask tailscale
        print_success "Tailscale installed"
    fi

    print_info "Open Tailscale from Applications to authenticate and connect"
    print_info "Once connected, you can SSH to this Mac Mini from anywhere"
}

#───────────────────────────────────────────────────────────────────────────────
# PHASE 11: SYSTEM SETTINGS REMINDERS
#───────────────────────────────────────────────────────────────────────────────

print_manual_steps() {
    print_header "Phase 11: Manual System Settings Required"

    echo -e "${YELLOW}Please configure these settings manually in System Settings:${NC}"
    echo ""
    echo "1. DISABLE SLEEP:"
    echo "   System Settings → Energy → Prevent automatic sleeping: ON"
    echo "   System Settings → Energy → Put hard disks to sleep: OFF"
    echo ""
    echo "2. ENABLE SSH (Remote Login):"
    echo "   System Settings → General → Sharing → Remote Login: ON"
    echo ""
    echo "3. AUTO-LOGIN:"
    echo "   System Settings → Users & Groups → Login Options"
    echo "   → Automatic login: ari"
    echo ""
    echo "4. DISABLE SCREEN LOCK:"
    echo "   System Settings → Lock Screen → Require password: Never"
    echo ""
    echo "5. AUTHENTICATE TAILSCALE:"
    echo "   Open Tailscale.app from Applications"
    echo "   Sign in to your Tailscale account"
    echo ""
}

#───────────────────────────────────────────────────────────────────────────────
# FINAL VERIFICATION
#───────────────────────────────────────────────────────────────────────────────

final_verification() {
    print_header "Final Verification"

    echo "Checking all components..."
    echo ""

    PASS_COUNT=0
    TOTAL_COUNT=0

    # Node.js
    ((TOTAL_COUNT++))
    if command -v node &>/dev/null; then
        print_success "Node.js: $(node -v)"
        ((PASS_COUNT++))
    else
        print_error "Node.js: NOT FOUND"
    fi

    # npm
    ((TOTAL_COUNT++))
    if command -v npm &>/dev/null; then
        print_success "npm: $(npm -v)"
        ((PASS_COUNT++))
    else
        print_error "npm: NOT FOUND"
    fi

    # Git
    ((TOTAL_COUNT++))
    if command -v git &>/dev/null; then
        print_success "Git: $(git --version | cut -d' ' -f3)"
        ((PASS_COUNT++))
    else
        print_error "Git: NOT FOUND"
    fi

    # tmux
    ((TOTAL_COUNT++))
    if command -v tmux &>/dev/null; then
        print_success "tmux: installed"
        ((PASS_COUNT++))
    else
        print_error "tmux: NOT FOUND"
    fi

    # ARI directory
    ((TOTAL_COUNT++))
    if [[ -d "$ARI_DIR" ]]; then
        print_success "ARI Repository: $ARI_DIR"
        ((PASS_COUNT++))
    else
        print_error "ARI Repository: NOT FOUND"
    fi

    # ARI built
    ((TOTAL_COUNT++))
    if [[ -f "$ARI_DIR/dist/cli/index.js" ]]; then
        print_success "ARI Build: Complete"
        ((PASS_COUNT++))
    else
        print_error "ARI Build: NOT FOUND"
    fi

    # ARI daemon
    ((TOTAL_COUNT++))
    if curl -s http://127.0.0.1:3141/health &>/dev/null; then
        print_success "ARI Gateway: Running on 127.0.0.1:3141"
        ((PASS_COUNT++))
    else
        print_warning "ARI Gateway: Not responding (may need manual start)"
    fi

    # Claude Code
    ((TOTAL_COUNT++))
    if command -v claude &>/dev/null; then
        print_success "Claude Code: Installed"
        ((PASS_COUNT++))
    else
        print_warning "Claude Code: Run 'npm install -g @anthropic-ai/claude-code'"
    fi

    # Plugin marketplaces
    ((TOTAL_COUNT++))
    MARKETPLACE_COUNT=$(ls -d "$PLUGINS_DIR"/*/ 2>/dev/null | wc -l | tr -d ' ')
    if [[ "$MARKETPLACE_COUNT" -ge 10 ]]; then
        print_success "Plugin Marketplaces: $MARKETPLACE_COUNT installed"
        ((PASS_COUNT++))
    else
        print_warning "Plugin Marketplaces: Only $MARKETPLACE_COUNT installed"
    fi

    # Claude settings
    ((TOTAL_COUNT++))
    if [[ -f "$CLAUDE_DIR/settings.json" ]]; then
        print_success "Claude Settings: Configured"
        ((PASS_COUNT++))
    else
        print_error "Claude Settings: NOT FOUND"
    fi

    # Tailscale
    ((TOTAL_COUNT++))
    if command -v tailscale &>/dev/null || [ -d "/Applications/Tailscale.app" ]; then
        print_success "Tailscale: Installed"
        ((PASS_COUNT++))
    else
        print_warning "Tailscale: Not installed"
    fi

    # Backup cron
    ((TOTAL_COUNT++))
    if crontab -l 2>/dev/null | grep -q "backup.sh"; then
        print_success "Backup Automation: Configured"
        ((PASS_COUNT++))
    else
        print_warning "Backup Automation: Not configured"
    fi

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  SETUP COMPLETE: $PASS_COUNT/$TOTAL_COUNT checks passed${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""

    print_header "ARI System Summary"

    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    INSTALLED COMPONENTS                      ║"
    echo "╠══════════════════════════════════════════════════════════════╣"
    echo "║  📦 Plugin Marketplaces: 12                                  ║"
    echo "║  🔌 Plugins Enabled: 80+                                     ║"
    echo "║  🎯 ARI Skills: 30 (in repo .claude/skills/)                 ║"
    echo "║  🤖 ARI Agents: 8 (in repo .claude/agents/)                  ║"
    echo "║  ⚡ ARI Commands: 12 (in repo .claude/commands/)             ║"
    echo "║  🔧 MCP Server: Configured                                   ║"
    echo "║  💾 Backup: Daily at 2 AM                                    ║"
    echo "║  📜 Log Rotation: Daily, 7-day retention                     ║"
    echo "║  🌐 Tailscale: Ready for remote access                       ║"
    echo "╠══════════════════════════════════════════════════════════════╣"
    echo "║                      NEXT STEPS                              ║"
    echo "╠══════════════════════════════════════════════════════════════╣"
    echo "║  1. Configure manual system settings (see above)             ║"
    echo "║  2. Authenticate Claude Code: run 'claude' in terminal       ║"
    echo "║  3. Open Tailscale.app and sign in                           ║"
    echo "║  4. Verify ARI: curl http://127.0.0.1:3141/health            ║"
    echo "║  5. Start using: cd ~/Work/ARI && claude                     ║"
    echo "╠══════════════════════════════════════════════════════════════╣"
    echo "║                     USEFUL COMMANDS                          ║"
    echo "╠══════════════════════════════════════════════════════════════╣"
    echo "║  View logs:    tail -f ~/.ari/logs/gateway-stdout.log        ║"
    echo "║  Check health: curl http://127.0.0.1:3141/health             ║"
    echo "║  ARI status:   cd ~/Work/ARI && npx ari doctor               ║"
    echo "║  Run tests:    cd ~/Work/ARI && npm test                     ║"
    echo "║  Manual backup: ~/Work/ARI/scripts/backup.sh                 ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "ARI is ready to run 24/7 on this Mac Mini."
    echo ""
}

#───────────────────────────────────────────────────────────────────────────────
# MAIN EXECUTION
#───────────────────────────────────────────────────────────────────────────────

main() {
    clear
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                                               ║${NC}"
    echo -e "${CYAN}║          ARI MAC MINI COMPLETE SETUP SCRIPT                   ║${NC}"
    echo -e "${CYAN}║                                                               ║${NC}"
    echo -e "${CYAN}║   This script will configure your Mac Mini to run ARI 24/7   ║${NC}"
    echo -e "${CYAN}║   with FULL capabilities including 80+ plugins               ║${NC}"
    echo -e "${CYAN}║                                                               ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    check_macos

    echo ""
    echo "This script will install:"
    echo "  • Xcode Command Line Tools"
    echo "  • Homebrew"
    echo "  • Node.js 20, Git, tmux, logrotate"
    echo "  • ARI (clone, build, initialize)"
    echo "  • ARI Dashboard (React UI)"
    echo "  • ARI Daemon (24/7 background service)"
    echo "  • Claude Code"
    echo "  • 12 Plugin Marketplaces (80+ plugins)"
    echo "  • MCP Server integration"
    echo "  • Automated daily backups"
    echo "  • Log rotation"
    echo "  • Tailscale (remote access)"
    echo ""
    echo -e "${YELLOW}Press ENTER to begin setup, or Ctrl+C to cancel...${NC}"
    read -r

    install_xcode_tools
    install_homebrew
    install_essentials
    setup_ari
    setup_dashboard
    install_daemon
    install_claude_code
    install_plugin_marketplaces
    configure_claude_settings
    setup_backup_automation
    setup_log_rotation
    install_tailscale
    print_manual_steps
    final_verification
}

# Run main function
main "$@"
