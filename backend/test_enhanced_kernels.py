#!/usr/bin/env python3
"""
Test script for Enhanced Kernel Scoring System
Tests POST /kernel/scores endpoint, AI-driven scoring, and document ingestion
"""

import asyncio
import json
import requests
from datetime import datetime

# Test configuration
API_BASE = "http://localhost:5002"

def test_kernel_scoring():
    """Test the POST /kernel/scores endpoint with AI-driven scoring"""
    print("🧪 Testing Enhanced Kernel Scoring System")
    print("=" * 50)
    
    # Test project data
    test_project = {
        "project_id": "TEST-001",
        "project_name": "Solar Farm Test Project",
        "metadata": {
            "financial": {
                "cost": 1500000,
                "roi": 0.18,
                "funding_source": "private",
                "apy_projection": 0.12
            },
            "ecological": {
                "carbon_impact": -150,
                "renewable_percent": 90,
                "material_sourcing": "recycled"
            },
            "social": {
                "job_creation": 30,
                "community_benefit": "high",
                "regulatory_alignment": "compliant"
            }
        }
    }
    
    try:
        print("📊 Testing POST /kernel/scores endpoint...")
        response = requests.post(
            f"{API_BASE}/kernel/scores",
            json=test_project,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ POST /kernel/scores successful!")
            print(f"Project: {result['project_name']}")
            print(f"Financial Score: {result['scores']['financial']}")
            print(f"Ecological Score: {result['scores']['ecological']}")
            print(f"Social Score: {result['scores']['social']}")
            print(f"Overall Score: {result['scores']['overall']}")
            print(f"Confidence: {result['confidence']}")
            print(f"AI Analysis: {result['ai_analysis']}")
        else:
            print(f"❌ POST /kernel/scores failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error testing POST /kernel/scores: {e}")

def test_get_kernel_scores():
    """Test the GET /kernel/scores endpoint"""
    print("\n📋 Testing GET /kernel/scores endpoint...")
    
    try:
        response = requests.get(f"{API_BASE}/kernel/scores")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ GET /kernel/scores successful!")
            print(f"Retrieved {len(result['kernel_scores'])} mock projects")
            for project in result['kernel_scores']:
                print(f"- {project['project_name']}: F={project['financial']['score']}, E={project['ecological']['score']}, S={project['social']['score']}")
        else:
            print(f"❌ GET /kernel/scores failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing GET /kernel/scores: {e}")

def test_swarm_protocol_integration():
    """Test Swarm Protocol integration with kernel scoring"""
    print("\n🤖 Testing Swarm Protocol Integration...")
    
    try:
        # Test swarm trace endpoint
        trace_data = {
            "agent": "KernelEvaluator",
            "action": "test_evaluation",
            "tool": "ai_kernel_scoring",
            "vault": "esg_kernels",
            "proposal": "TEST-001",
            "score": 85.5,
            "comment": "Test kernel evaluation via Swarm Protocol"
        }
        
        response = requests.post(
            f"{API_BASE}/swarm/trace",
            json=trace_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Swarm Protocol integration successful!")
            print(f"Logged action: {result['status']}")
        else:
            print(f"❌ Swarm Protocol integration failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing Swarm Protocol integration: {e}")

def test_websocket_connection():
    """Test WebSocket connection for real-time updates"""
    print("\n🔌 Testing WebSocket Connection...")
    
    try:
        import websocket
        import threading
        import time
        
        def on_message(ws, message):
            print(f"📡 WebSocket message received: {message[:100]}...")
        
        def on_error(ws, error):
            print(f"❌ WebSocket error: {error}")
        
        def on_close(ws, close_status_code, close_msg):
            print("🔌 WebSocket connection closed")
        
        def on_open(ws):
            print("✅ WebSocket connection established!")
            # Close after 3 seconds
            threading.Timer(3.0, ws.close).start()
        
        # Connect to WebSocket
        ws_url = f"ws://localhost:5002/ws/kernel/updates"
        ws = websocket.WebSocketApp(
            ws_url,
            on_open=on_open,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close
        )
        
        # Run WebSocket in a separate thread
        wst = threading.Thread(target=ws.run_forever)
        wst.daemon = True
        wst.start()
        
        # Wait for connection
        time.sleep(5)
        
    except ImportError:
        print("⚠️  websocket-client not installed, skipping WebSocket test")
    except Exception as e:
        print(f"❌ Error testing WebSocket: {e}")

def main():
    """Run all tests"""
    print("🚀 Starting Enhanced Kernel Scoring Tests")
    print(f"API Base: {API_BASE}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 60)
    
    # Run tests
    test_get_kernel_scores()
    test_kernel_scoring()
    test_swarm_protocol_integration()
    test_websocket_connection()
    
    print("\n" + "=" * 60)
    print("🏁 Enhanced Kernel Scoring Tests Complete!")
    print("Check the frontend at http://localhost:3000 to see the enhanced interface")

if __name__ == "__main__":
    main()
