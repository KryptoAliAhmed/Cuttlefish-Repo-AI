#!/usr/bin/env python3
"""
Simple WebSocket test script to verify the WebSocket endpoint works correctly
"""

import asyncio
import websockets
import json
import sys

async def test_websocket():
    """Test WebSocket connection to the kernel updates endpoint"""
    uri = "ws://localhost:5002/ws/kernel/updates"
    
    try:
        print(f"Connecting to {uri}...")
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully!")
            
            # Wait for a few messages
            for i in range(3):
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                    data = json.loads(message)
                    print(f"📨 Received message {i+1}:")
                    print(f"   Type: {data.get('type')}")
                    print(f"   Timestamp: {data.get('timestamp')}")
                    print(f"   Scores count: {len(data.get('scores', []))}")
                    print()
                except asyncio.TimeoutError:
                    print(f"⏰ Timeout waiting for message {i+1}")
                    break
                    
            print("✅ WebSocket test completed successfully!")
            
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    try:
        result = asyncio.run(test_websocket())
        sys.exit(0 if result else 1)
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted by user")
        sys.exit(0)
