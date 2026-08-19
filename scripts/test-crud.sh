#!/bin/bash
set -e
cd /home/z/my-project

# Start dev server in background
npx next dev -p 3000 > /tmp/test-dev.log 2>&1 &
SERVER_PID=$!

# Wait for server
echo "Waiting for server (PID $SERVER_PID)..."
for i in $(seq 1 20); do
  if curl -s --max-time 2 http://127.0.0.1:3000/ -o /dev/null 2>/dev/null; then
    echo "Server ready!"
    break
  fi
  sleep 1
done

# Test GET
echo "=== GET ==="
GET_COUNT=$(curl -s --max-time 10 http://127.0.0.1:3000/api/products?sellerId=cmsxnyyop0004oinvqpgte8zx | python3 -c "import sys,json;print(len(json.load(sys.stdin).get('products',[])))")
echo "Products: $GET_COUNT"

# Test ADD
echo "=== ADD ==="
ADD_RES=$(curl -s --max-time 20 -X POST http://127.0.0.1:3000/api/products \
  -H 'Content-Type: application/json' \
  -d '{"name":"CRUD Test","price":25,"category":"Electronics","sellerId":"cmsxnyyop0004oinvqpgte8zx"}')
NEW_ID=$(echo $ADD_RES | python3 -c "import sys,json;print(json.load(sys.stdin)['product']['id'])")
echo "Created: $NEW_ID"

# Test EDIT
echo "=== EDIT ==="
EDIT_RES=$(curl -s --max-time 20 -X PUT http://127.0.0.1:3000/api/products/$NEW_ID \
  -H 'Content-Type: application/json' \
  -d '{"name":"CRUD Edited","price":99}')
echo $EDIT_RES | python3 -c "import sys,json;p=json.load(sys.stdin)['product'];print(f'Edited: {p[\"name\"]} \${p[\"price\"]}')"

# Test TOGGLE
echo "=== TOGGLE ==="
TOGGLE_RES=$(curl -s --max-time 20 -X PUT http://127.0.0.1:3000/api/products/$NEW_ID \
  -H 'Content-Type: application/json' \
  -d '{"isActive":false}')
echo $TOGGLE_RES | python3 -c "import sys,json;p=json.load(sys.stdin)['product'];print(f'Active: {p[\"isActive\"]}')"

# Test DELETE
echo "=== DELETE ==="
DEL_RES=$(curl -s --max-time 20 -X DELETE http://127.0.0.1:3000/api/products/$NEW_ID)
echo $DEL_RES | python3 -c "import sys,json;p=json.load(sys.stdin)['product'];print(f'Deleted: {p[\"name\"]} active={p[\"isActive\"]}')"

# Cleanup
echo "=== CLEANUP ==="
kill $SERVER_PID 2>/dev/null
echo "All CRUD tests passed!"
