#!/bin/bash
#═══════════════════════════════════════════════════════════════════════════════
#  ARI Mac Mini Setup - ARI-Assistant GitHub Account
#  Purpose: Configure Mac Mini to run ARI autonomously using ARI's own identity
#
#  This script configures:
#  - ARI's SSH key for GitHub authentication
#  - Git config to commit as ARI
#  - Launchd service for 24/7 operation
#  - Environment variables
#═══════════════════════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() { echo -e "${BLUE}▶ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

#───────────────────────────────────────────────────────────────────────────────
# PHASE 1: SSH KEY SETUP
#───────────────────────────────────────────────────────────────────────────────

setup_ssh_key() {
    print_header "Phase 1: Setting Up ARI's SSH Key"

    SSH_DIR="$HOME/.ssh"
    ARI_KEY="$SSH_DIR/ari_github"

    mkdir -p "$SSH_DIR"
    chmod 700 "$SSH_DIR"

    if [[ -f "$ARI_KEY" ]]; then
        print_success "ARI SSH key already exists at $ARI_KEY"
    else
        print_step "Generating new SSH key for ARI..."
        ssh-keygen -t ed25519 -C "ARI-Assistant@users.noreply.github.com" -f "$ARI_KEY" -N ""
        print_success "SSH key generated"

        echo ""
        print_warning "Add this public key to ARI's GitHub account:"
        echo ""
        cat "$ARI_KEY.pub"
        echo ""
        print_warning "Go to: https://github.com/settings/keys (logged in as RI-Assistant)"
        echo ""
        read -p "Press ENTER after adding the key to GitHub..."
    fi

    # Configure SSH to use ARI's key for GitHub
    print_step "Configuring SSH for ARI..."

    if ! grep -q "Host github-ari" "$SSH_DIR/config" 2>/dev/null; then
        cat >> "$SSH_DIR/config" << 'EOF'

# ARI GitHub Bot Account
Host github-ari
    HostName github.com
    User git
    IdentityFile ~/.ssh/ari_github
    IdentitiesOnly yes

# Default GitHub (use ARI for this machine)
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/ari_github
    IdentitiesOnly yes
EOF
        print_success "SSH config updated"
    else
        print_success "SSH config already configured"
    fi

    chmod 600 "$SSH_DIR/config"

    # Add to SSH agent
    eval "$(ssh-agent -s)" > /dev/null
    ssh-add "$ARI_KEY" 2>/dev/null || true

    # Test connection
    print_step "Testing GitHub connection..."
    if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
        print_success "GitHub authentication successful!"
    else
        print_warning "Could not verify GitHub connection. Make sure the key is added to GitHub."
    fi
}

#───────────────────────────────────────────────────────────────────────────────
# PHASE 2: GIT CONFIG
#───────────────────────────────────────────────────────────────────────────────

setup_git_config() {
    print_header "Phase 2: Configuring Git for ARI"

    # Set global git config for this machine to use ARI
    print_step "Setting up Git identity..."

    git config --global user.name "ARI"
    git config --global user.email "194972212+RI-Assistant@users.noreply.github.com"

    # Configure commit signing (optional)
    git config --global commit.gpgsign false

    # Set default branch
    git config --global init.defaultBranch main

    # Configure pull behavior
    git config --global pull.rebase false

    print_success "Git configured as ARI"
    echo ""
    echo "  Name:  $(git config --global user.name)"
    echo "  Email: $(git config --global user.email)"
}

#───────────────────────────────────────────────────────────────────────────────
# PHASE 3: ENVIRONMENT VARIABLES
#───────────────────────────────────────────────────────────────────────────────

setup_environment() {
    print_header "Phase 3: Setting Up Environment Variables"

    SHELL_RC="$HOME/.zshrc"

    if ! grep -q "ARI Environment" "$SHELL_RC" 2>/dev/null; then
        cat >> "$SHELL_RC" << 'EOF'

# ═══════════════════════════════════════════════════════════════
# ARI Environment Configuration
# ═══════════════════════════════════════════════════════════════

export ARI_HOME="$HOME/Work/ARI"
export ARI_CONFIG="$HOME/.ari"
export ARI_LOGS="$HOME/.ari/logs"
export ARI_DATA="$HOME/.ari/data"
export ARI_IDENTITY="ARI-Assistant"

# Ensure ARI directories exist
mkdir -p "$ARI_CONFIG" "$ARI_LOGS" "$ARI_DATA"

# Add ARI to PATH
export PATH="$ARI_HOME/node_modules/.bin:$PATH"

# Node.js configuration
export NODE_ENV="production"

# SSH Agent (ensure key is loaded)
if [ -z "$SSH_AUTH_SOCK" ]; then
    eval "$(ssh-agent -s)" > /dev/null
    ssh-add ~/.ssh/ari_github 2>/dev/null
fi

# ARI aliases
alias ari-start="cd $ARI_HOME && npm run gateway:start"
alias ari-stop="cd $ARI_HOME && npm run gateway:stop"
alias ari-status="cd $ARI_HOME && npm run gateway:status"
alias ari-logs="tail -f $ARI_LOGS/*.log"
alias ari-daemon="cd $ARI_HOME && npm run daemon:start"

EOF
        print_success "Environment variables added to $SHELL_RC"
    else
        print_success "Environment already configured"
    fi

    # Create ARI directories
    mkdir -p "$HOME/.ari/logs" "$HOME/.ari/data" "$HOME/.ari/backups"
    print_success "ARI directories created"
}

#───────────────────────────────────────────────────────────────────────────────
# PHASE 4: LAUNCHD SERVICE
#───────────────────────────────────────────────────────────────────────────────

setup_launchd() {
    print_header "Phase 4: Setting Up Launchd Service"

    PLIST_DIR="$HOME/Library/LaunchAgents"
    PLIST_FILE="$PLIST_DIR/com.ari.daemon.plist"

    mkdir -p "$PLIST_DIR"

    print_step "Creating launchd plist..."

    cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ari.daemon</string>

    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>$HOME/Work/ARI/dist/ops/daemon.js</string>
    </array>

    <key>WorkingDirectory</key>
    <string>$HOME/Work/ARI</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>ARI_HOME</key>
        <string>$HOME/Work/ARI</string>
        <key>ARI_IDENTITY</key>
        <string>ARI-Assistant</string>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
        <key>HOME</key>
        <string>$HOME</string>
        <key>SSH_AUTH_SOCK</key>
        <string>$HOME/.ssh/agent.sock</string>
    </dict>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
        <key>Crashed</key>
        <true/>
    </dict>

    <key>ThrottleInterval</key>
    <integer>30</integer>

    <key>StandardOutPath</key>
    <string>$HOME/.ari/logs/daemon.log</string>

    <key>StandardErrorPath</key>
    <string>$HOME/.ari/logs/daemon-error.log</string>

    <key>ProcessType</key>
    <string>Background</string>
</dict>
</plist>
EOF

    print_success "Launchd plist created at $PLIST_FILE"

    # Load the service
    print_step "Loading launchd service..."
    launchctl unload "$PLIST_FILE" 2>/dev/null || true
    launchctl load "$PLIST_FILE"

    print_success "ARI daemon service configured"
    echo ""
    echo "  Control commands:"
    echo "    Start:  launchctl start com.ari.daemon"
    echo "    Stop:   launchctl stop com.ari.daemon"
    echo "    Status: launchctl list | grep ari"
}

#───────────────────────────────────────────────────────────────────────────────
# PHASE 5: CRON JOBS
#───────────────────────────────────────────────────────────────────────────────

setup_cron_jobs() {
    print_header "Phase 5: Setting Up Cron Jobs"

    CRON_TMP=$(mktemp)
    crontab -l > "$CRON_TMP" 2>/dev/null || true

    if ! grep -q "ARI Autonomous Tasks" "$CRON_TMP"; then
        cat >> "$CRON_TMP" << 'EOF'

# ═══════════════════════════════════════════════════════════════
# ARI Autonomous Tasks
# ═══════════════════════════════════════════════════════════════

# Daily backup at 3 AM
0 3 * * * cd $HOME/Work/ARI && ./scripts/backup.sh >> $HOME/.ari/logs/backup.log 2>&1

# Log rotation at 4 AM
0 4 * * * find $HOME/.ari/logs -name "*.log" -mtime +7 -delete

# Health check every 5 minutes
*/5 * * * * curl -s http://127.0.0.1:3145/health > /dev/null || launchctl kickstart -k gui/$UID/com.ari.daemon

# Git pull for updates at 5 AM (using ARI's identity)
0 5 * * * cd $HOME/Work/ARI && git pull origin main >> $HOME/.ari/logs/updates.log 2>&1

EOF
        crontab "$CRON_TMP"
        print_success "Cron jobs installed"
    else
        print_success "Cron jobs already configured"
    fi

    rm "$CRON_TMP"
}

#───────────────────────────────────────────────────────────────────────────────
# PHASE 6: VERIFY SETUP
#───────────────────────────────────────────────────────────────────────────────

verify_setup() {
    print_header "Phase 6: Verifying Setup"

    echo ""
    print_step "Checking SSH key..."
    if [[ -f "$HOME/.ssh/ari_github" ]]; then
        print_success "SSH key exists"
    else
        print_error "SSH key missing!"
    fi

    print_step "Checking Git config..."
    if git config --global user.email | grep -q "RI-Assistant"; then
        print_success "Git configured as ARI"
    else
        print_error "Git not configured correctly!"
    fi

    print_step "Checking launchd service..."
    if launchctl list | grep -q "com.ari.daemon"; then
        print_success "Launchd service loaded"
    else
        print_warning "Launchd service not running"
    fi

    print_step "Checking ARI directories..."
    if [[ -d "$HOME/.ari/logs" ]]; then
        print_success "ARI directories exist"
    else
        print_error "ARI directories missing!"
    fi

    echo ""
    print_header "Setup Complete!"
    echo ""
    echo "  ARI is configured to run autonomously on this Mac Mini"
    echo ""
    echo "  Identity: ARI-Assistant (GitHub Bot)"
    echo "  SSH Key:  ~/.ssh/ari_github"
    echo "  Logs:     ~/.ari/logs/"
    echo "  Service:  com.ari.daemon (launchd)"
    echo ""
    echo "  Quick Commands:"
    echo "    ari-start   - Start gateway"
    echo "    ari-stop    - Stop gateway"
    echo "    ari-status  - Check status"
    echo "    ari-logs    - View logs"
    echo ""
}

#───────────────────────────────────────────────────────────────────────────────
# MAIN
#───────────────────────────────────────────────────────────────────────────────

main() {
    print_header "ARI Mac Mini Setup - ARI-Assistant Identity"

    echo "This script will configure this Mac Mini to run ARI autonomously"
    echo "using the ARI-Assistant GitHub account."
    echo ""
    read -p "Press ENTER to continue or Ctrl+C to cancel..."

    setup_ssh_key
    setup_git_config
    setup_environment
    setup_launchd
    setup_cron_jobs
    verify_setup
}

# Run main if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
