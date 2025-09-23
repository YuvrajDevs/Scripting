#!/bin/bash

LOG_DIR="logs"
DAYS_TO_KEEP=7

echo "Finding .log files in '$LOG_DIR' older than $DAYS_TO_KEEP day"
FILES_TO_DELETE=$(find $LOG_DIR -type f -name "*.log" -mtime +$DAYS_TO_KEEP )

if [ -z "$FILES_TO_DELETE" ]; then
  echo "No old log files to delete."
  exit 0
fi

echo "The following files will be deleted:"
echo "$FILES_TO_DELETE"

read -p "Are you sure you want to delete these files? (y/n): " CONFIRM

if [[ "$CONFIRM" == "y" ]]; then
  find $LOG_DIR -type f -name "*.log" -mtime +$DAYS_TO_KEEP -delete
  echo "Files deleted."
else
  echo "Aborted. No files were deleted."
fi
