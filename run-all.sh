#!/bin/bash

LOG_FILE="profiling_debug.log"

log() {
  echo "$1" | tee -a "$LOG_FILE"
}

log "Running Chrome profiling..."
node project/scripts/profile-chrome.js >> "$LOG_FILE" 2>&1

if [ $? -ne 0 ]; then
  log "Chrome profiling failed!"
  exit 1
fi

log "Merging Chrome profiling data..."
node project/scripts/merge-task-data.js >> "$LOG_FILE" 2>&1

if [ $? -ne 0 ]; then
  log "Merging task data failed!"
  exit 1
fi

log "Running Safari profiling..."
node project/scripts/profile-safari.js >> "$LOG_FILE" 2>&1

if [ $? -ne 0 ]; then
  log "Safari profiling failed!"
  exit 1
fi

log "Starting the main server..."
node visualization/server.js >> "$LOG_FILE" 2>&1 &

log "Starting the Safari server..."
node visualization/server-safari.js >> "$LOG_FILE" 2>&1 &

wait

log "All tasks completed successfully."
