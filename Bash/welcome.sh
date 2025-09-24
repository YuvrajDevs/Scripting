#!/bin/bash

CURRENT_USER=$(whoami)
CURRENT_DATE=$(date +"%A, %B %d, %Y - %r")
SYSTEM_UPTIME=$(uptime -p)

echo "Welcome back, $CURRENT_USER!"
echo ""
echo "System Information for $(hostname)"
echo ""
echo "Today's Date: $CURRENT_DATE"
echo "System Uptime: $SYSTEM_UPTIME"

