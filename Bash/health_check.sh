#!/bin/bash

DISK_THRESHOLD=80

HOSTNAME=$(hostname)
# RENAMED the variable here to match its use below
DISK_USAGE_PERCENT=$(df -h / | awk 'NR==2 {print $5}'| sed 's/%//' )
MEMORY_USAGE=$(free -m | awk 'NR==2 {print $3 "/" $2 " MB"}')

# Use the CORRECT variable name in the 'if' check
if [ $DISK_USAGE_PERCENT -gt $DISK_THRESHOLD ]; then
  # Use the CORRECT variable name in the 'echo' command
  echo "WARNING: Disk usage is high: $DISK_USAGE_PERCENT%"
else
  # Use the CORRECT variable name in the 'echo' command
  echo "Disk usage is normal: $DISK_USAGE_PERCENT%"
fi
