#!/bin/bash
#═══════════════════════════════════════════════════════════════
#  ARI SMS Bridge Setup Script
#  Sets up two-way texting with ARI via Twilio
#═══════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

ARI_DIR="$HOME/Work/ARI"
ENV_FILE="$HOME/.ari/sms.env"

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}              ARI SMS Bridge Setup                              ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Check for env file
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Creating config file at $ENV_FILE${NC}"
    mkdir -p "$HOME/.ari"
    cp "$ARI_DIR/src/integrations/sms/sms.env.example" "$ENV_FILE"
    echo ""
    echo -e "${RED}ACTION REQUIRED:${NC}"
    echo ""
    echo "1. Go to https://www.twilio.com/try-twilio (free trial available)"
    echo "2. Create account and get a phone number"
    echo "3. Find your credentials at https://console.twilio.com"
    echo "4. Edit $ENV_FILE with your values:"
    echo ""
    echo -e "${CYAN}   nano $ENV_FILE${NC}"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Load env
set -a
source "$ENV_FILE"
set +a

# Validate
MISSING=""
[ -z "$TWILIO_ACCOUNT_SID" ] || [ "$TWILIO_ACCOUNT_SID" = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" ] && MISSING="$MISSING TWILIO_ACCOUNT_SID"
[ -z "$TWILIO_AUTH_TOKEN" ] || [ "$TWILIO_AUTH_TOKEN" = "your_auth_token_here" ] && MISSING="$MISSING TWILIO_AUTH_TOKEN"
[ -z "$TWILIO_PHONE_NUMBER" ] || [ "$TWILIO_PHONE_NUMBER" = "+1234567890" ] && MISSING="$MISSING TWILIO_PHONE_NUMBER"
[ -z "$ARI_ALLOWED_NUMBERS" ] || [ "$ARI_ALLOWED_NUMBERS" = "+1234567890" ] && MISSING="$MISSING ARI_ALLOWED_NUMBERS"
[ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "sk-ant-xxxxxxxxxxxxxxxxxxxxx" ] && MISSING="$MISSING ANTHROPIC_API_KEY"

if [ -n "$MISSING" ]; then
    echo -e "${RED}Missing or placeholder values in $ENV_FILE:${NC}"
    echo "$MISSING"
    echo ""
    echo "Edit the file and fill in real values:"
    echo -e "${CYAN}   nano $ENV_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Config validated${NC}"

# Install dependencies if needed
echo ""
echo "Installing dependencies..."
cd "$ARI_DIR"
npm install @anthropic-ai/sdk @fastify/formbody --save 2>/dev/null || true

# Build
echo "Building..."
npm run build 2>/dev/null || {
    echo -e "${YELLOW}Build warning - continuing anyway${NC}"
}

# Create LaunchAgent for 24/7 operation
PLIST_FILE="$HOME/Library/LaunchAgents/com.ari.sms-bridge.plist"
NODE_PATH=$(which node)

echo ""
echo "Creating background service..."

cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ari.sms-bridge</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NODE_PATH</string>
        <string>--env-file=$ENV_FILE</string>
        <string>$ARI_DIR/dist/integrations/sms/twilio-bridge.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$ARI_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$HOME/.ari/logs/sms-bridge-stdout.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/.ari/logs/sms-bridge-stderr.log</string>
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

# Load the service
launchctl unload "$PLIST_FILE" 2>/dev/null || true
launchctl load "$PLIST_FILE"

echo -e "${GREEN}✓ SMS Bridge service installed${NC}"

# Check if running
sleep 2
if curl -s http://127.0.0.1:3142/health | grep -q "ok"; then
    echo -e "${GREEN}✓ SMS Bridge is running on port 3142${NC}"
else
    echo -e "${YELLOW}⚠ Service may still be starting. Check logs:${NC}"
    echo "   tail -f ~/.ari/logs/sms-bridge-stderr.log"
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}                    NEXT STEPS                                  ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "1. Expose port 3142 to the internet (for Twilio webhook)"
echo ""
echo "   Option A - Tailscale Funnel (recommended):"
echo "   ${CYAN}tailscale funnel 3142${NC}"
echo ""
echo "   Option B - ngrok (for testing):"
echo "   ${CYAN}ngrok http 3142${NC}"
echo ""
echo "2. Set webhook URL in Twilio Console:"
echo "   - Go to: https://console.twilio.com/phone-numbers"
echo "   - Click your number"
echo "   - Under 'Messaging', set webhook to:"
echo "   ${CYAN}https://YOUR_URL/sms/incoming${NC}"
echo ""
echo "3. Text your Twilio number to talk to ARI!"
echo ""
echo "Your Twilio number: $TWILIO_PHONE_NUMBER"
echo ""
