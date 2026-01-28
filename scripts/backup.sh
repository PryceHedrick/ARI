#!/usr/bin/env bash
set -euo pipefail

# ARI Data Backup Script
# Creates a timestamped backup of ARI configuration and data

ARI_DIR="$HOME/.ari"
BACKUP_DIR="$HOME/.ari/backups"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_NAME="ari-backup-$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

echo "ARI Data Backup"
echo "==============="
echo ""

# Check if ARI directory exists
if [ ! -d "$ARI_DIR" ]; then
    echo "Error: ARI directory not found at $ARI_DIR"
    echo "No data to backup."
    exit 1
fi

# Create backup directory
echo "Creating backup directory..."
mkdir -p "$BACKUP_PATH"
echo "  $BACKUP_PATH"
echo ""

# Track what we backed up
BACKED_UP=()

# Backup config.json
if [ -f "$ARI_DIR/config.json" ]; then
    echo "Backing up config.json..."
    cp "$ARI_DIR/config.json" "$BACKUP_PATH/"
    BACKED_UP+=("config.json")
fi

# Backup audit.json
if [ -f "$ARI_DIR/audit.json" ]; then
    echo "Backing up audit.json..."
    cp "$ARI_DIR/audit.json" "$BACKUP_PATH/"
    BACKED_UP+=("audit.json")
fi

# Backup contexts directory
if [ -d "$ARI_DIR/contexts" ]; then
    echo "Backing up contexts/..."
    cp -R "$ARI_DIR/contexts" "$BACKUP_PATH/"
    BACKED_UP+=("contexts/")
fi

# Backup data directory if it exists
if [ -d "$ARI_DIR/data" ]; then
    echo "Backing up data/..."
    cp -R "$ARI_DIR/data" "$BACKUP_PATH/"
    BACKED_UP+=("data/")
fi

echo ""

# Create backup summary
SUMMARY_FILE="$BACKUP_PATH/backup-info.txt"
cat > "$SUMMARY_FILE" <<EOF
ARI Backup Summary
==================

Backup Time: $(date)
Backup Path: $BACKUP_PATH

Files backed up:
EOF

for item in "${BACKED_UP[@]}"; do
    echo "  - $item" >> "$SUMMARY_FILE"
done

# Calculate backup size
BACKUP_SIZE=$(du -sh "$BACKUP_PATH" | awk '{print $1}')
echo "" >> "$SUMMARY_FILE"
echo "Total size: $BACKUP_SIZE" >> "$SUMMARY_FILE"

# Display summary
echo "Backup Summary"
echo "=============="
echo ""
echo "Backup created: $BACKUP_PATH"
echo ""
echo "Files backed up:"
for item in "${BACKED_UP[@]}"; do
    echo "  - $item"
done
echo ""
echo "Total size: $BACKUP_SIZE"
echo ""

# Create tarball for easier transfer
TARBALL="$BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo "Creating compressed archive..."
cd "$BACKUP_DIR"
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_PATH"

TARBALL_SIZE=$(du -sh "$TARBALL" | awk '{print $1}')
echo "  $TARBALL ($TARBALL_SIZE)"
echo ""

echo "Backup complete!"
echo ""
echo "Archive: $TARBALL"
echo ""
echo "To restore from this backup:"
echo "  tar -xzf $TARBALL -C $BACKUP_DIR"
echo "  cp -R $BACKUP_PATH/* $ARI_DIR/"
