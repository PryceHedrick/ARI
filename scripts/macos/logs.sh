#!/usr/bin/env bash
set -euo pipefail

# ARI Gateway - Log Viewer
# Displays gateway logs with optional follow mode

LOG_DIR="$HOME/.ari/logs"
STDOUT_LOG="$LOG_DIR/gateway-stdout.log"
STDERR_LOG="$LOG_DIR/gateway-stderr.log"

# Default options
FOLLOW=false
LINES=50

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -n|--lines)
            LINES="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [-f] [-n lines]"
            echo ""
            echo "Options:"
            echo "  -f, --follow    Follow log output (like tail -f)"
            echo "  -n, --lines N   Show last N lines (default: 50)"
            echo "  -h, --help      Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0              Show last 50 lines"
            echo "  $0 -n 100       Show last 100 lines"
            echo "  $0 -f           Follow logs in real-time"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h for help"
            exit 1
            ;;
    esac
done

# Check if logs exist
if [ ! -f "$STDOUT_LOG" ] && [ ! -f "$STDERR_LOG" ]; then
    echo "No log files found at $LOG_DIR"
    echo ""
    echo "Expected files:"
    echo "  $STDOUT_LOG"
    echo "  $STDERR_LOG"
    echo ""
    echo "Is the service installed and running?"
    exit 1
fi

# Display logs
if [ "$FOLLOW" = true ]; then
    echo "Following ARI Gateway logs (Ctrl+C to stop)..."
    echo ""

    # Follow both stdout and stderr
    if [ -f "$STDOUT_LOG" ] && [ -f "$STDERR_LOG" ]; then
        tail -f "$STDOUT_LOG" "$STDERR_LOG"
    elif [ -f "$STDOUT_LOG" ]; then
        tail -f "$STDOUT_LOG"
    else
        tail -f "$STDERR_LOG"
    fi
else
    echo "ARI Gateway Logs (last $LINES lines)"
    echo "====================================="
    echo ""

    # Show stdout
    if [ -f "$STDOUT_LOG" ]; then
        echo "--- STDOUT ---"
        tail -n "$LINES" "$STDOUT_LOG"
        echo ""
    fi

    # Show stderr
    if [ -f "$STDERR_LOG" ]; then
        echo "--- STDERR ---"
        tail -n "$LINES" "$STDERR_LOG"
        echo ""
    fi

    echo "Log files:"
    echo "  $STDOUT_LOG"
    echo "  $STDERR_LOG"
fi
