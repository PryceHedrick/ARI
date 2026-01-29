#!/bin/bash
# ARI Claude Code Setup Script
# Run this after cloning ARI to configure Claude Code for this project

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARI_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🤖 Setting up ARI for Claude Code..."
echo "   ARI Root: $ARI_ROOT"

# Install dependencies
echo "📦 Installing dependencies..."
cd "$ARI_ROOT"
npm install

# Build the project
echo "🔨 Building ARI..."
npm run build

# Copy skills, commands, agents to global Claude config
CLAUDE_DIR="$HOME/.claude"
mkdir -p "$CLAUDE_DIR/skills" "$CLAUDE_DIR/commands" "$CLAUDE_DIR/agents"

echo "📋 Installing Claude Code extensions..."
cp -r "$ARI_ROOT/.claude/skills/"* "$CLAUDE_DIR/skills/" 2>/dev/null || true
cp -r "$ARI_ROOT/.claude/commands/"* "$CLAUDE_DIR/commands/" 2>/dev/null || true
cp -r "$ARI_ROOT/.claude/agents/"* "$CLAUDE_DIR/agents/" 2>/dev/null || true

# Add MCP server (user scope so it persists)
echo "🔌 Configuring MCP server..."
claude mcp remove ari -s user 2>/dev/null || true
claude mcp add -s user ari -- npx tsx "$ARI_ROOT/src/mcp/server.ts"

# Verify
echo ""
echo "✅ ARI Claude Code setup complete!"
echo ""
echo "Installed:"
echo "  - $(ls "$CLAUDE_DIR/skills" 2>/dev/null | wc -l | tr -d ' ') skills"
echo "  - $(ls "$CLAUDE_DIR/commands" 2>/dev/null | wc -l | tr -d ' ') commands"
echo "  - $(ls "$CLAUDE_DIR/agents" 2>/dev/null | wc -l | tr -d ' ') agents"
echo "  - MCP server: ari"
echo ""
echo "Run 'claude mcp list' to verify the MCP server is connected."
echo ""
echo "Available commands:"
echo "  /ari-status    - Check ARI system health"
echo "  /ari-learn     - Store session learnings"
echo "  /ari-recall    - Retrieve stored knowledge"
echo "  /ari-secure    - Security analysis"
echo "  /ari-deploy    - Deployment validation"
