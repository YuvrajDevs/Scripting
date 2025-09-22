#!/bin/bash
HOSTNAME=$(hostname)
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}')
MEMORY_USAGE=$(free -m | awk 'NR==2 {print $3 "/" $2 " MB"}')

echo "--- System Health Report ---"
echo "Hostname: $HOSTNAME"
echo "Disk Usage: $DISK_USAGE"
echo "Memory Usage: $MEMORY_USAGE"
echo "--------------------------"
