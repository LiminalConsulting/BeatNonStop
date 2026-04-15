#!/bin/bash
source .env.sync
curl -sS -X POST "$WORKER_URL/api/reply" \
  -H "Authorization: Bearer $SYNC_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$1"
