#!/bin/bash

DISK_THRESHOLD=80

HOSTNAME=$(hostname)
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}'| sed 's/%//' )
MEMORY_USAGE=$(free -m | awk 'NR==2 {print $3 "/" $2 " MB"}')

if [ $DISK_USAGE_PERCENT -gt $DISK_THRESHOLD ]; then
  echo "WARNING: Disk usage is high: $DISK_USAGE_PERCENT%"
else
  echo "Disk usage is normal: $DISK_USAGE_PERCENT%"
fi
