#!/bin/bash
cd /home/z/my-project
while true; do
  node .next/standalone/server.js -p 3000 2>&1
  echo "[$(date)] Server crashed, restarting in 1s..."
  sleep 1
done
