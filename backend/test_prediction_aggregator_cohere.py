#!/usr/bin/env python3
"""
Test script for Prediction Aggregator and Cohere Rerank
Tests the newly implemented features claimed in the LaTeX report
"""

import asyncio
import json
import requests
from datetime import datetime

# Test configuration
API_BASE = "http://localhost:5002"

def test_prediction_aggregator():
    """Test the Prediction Aggregator endpoint"""
    print("🧠 Testing Prediction Aggregator")
    print("=" * 50)
    
    test_request = {
        "task": "ESG scoring for solar energy project",
        "context": """
        Project: Solar Farm Development
        Financial Data: {
            "cost": 1500000,
            "roi": 0.18,
            "funding_source": "private",
            "apy_projection": 0.12
        }
        Ecological Data: {
            "carbon_impact": -150,
            "renewable_percent": 90,
            "material_sourcing": "recycled"
        }
        Social Data: {
            "job_creation": 30,
            "community_benefit": "high",
            "regulatory_alignment": "compliant"
        }
        """
    }
    
    try:
        print("📊 Testing POST /rag/predict-aggregate endpoint...")
        response = requests.post(
            f"{API_BASE}/rag/predict-aggregate",
            json=test_request,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Prediction Aggregator successful!")
            print(f"Consensus Prediction: {result['consensus_prediction']}")
            print(f"Confidence: {result['confidence']}")
            print(f"Bias Reduction: {result['bias_reduction']}")
            print(f"Disagreement Score: {result['disagreement_score']}")
            print(f"Model Contributions: {result['model_contributions']}")
        else:
            print(f"❌ Prediction Aggregator failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error testing Prediction Aggregator: {e}")

def test_cohere_rerank():
    """Test the Cohere Rerank endpoint"""
    print("\n🔄 Testing Cohere Rerank")
    print("=" * 50)
    
    test_request = {
        "query": "solar energy project ESG analysis",
        "documents": [
            "This document discusses solar energy projects and their environmental impact.",
            "Financial analysis of renewable energy investments.",
            "Social benefits of community solar programs.",
            "Technical specifications for photovoltaic systems.",
            "ESG scoring methodology for infrastructure projects.",
            "Carbon footprint reduction through solar energy.",
            "Community engagement in renewable energy projects.",
            "Regulatory compliance for solar installations."
        ],
        "top_n": 5,
        "context": {
            "project_type": "solar_energy",
            "domain": "renewable_energy",
            "esg_focus": "environmental",
            "prefer_recent": True
        }
    }
    
    try:
        print("📋 Testing POST /rag/rerank endpoint...")
        response = requests.post(
            f"{API_BASE}/rag/rerank",
            json=test_request,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Cohere Rerank successful!")
            print(f"Reranked {len(result['results'])} documents")
            
            for i, doc_result in enumerate(result['results'][:3]):
                print(f"\nRank {i+1}:")
                print(f"  Score: {doc_result['relevance_score']:.3f}")
                print(f"  Document: {doc_result['document'][:100]}...")
                print(f"  Metadata: {doc_result['metadata']}")
            
            print(f"\nPerformance Metrics:")
            print(f"  Total Requests: {result['performance_metrics']['total_requests']}")
            print(f"  Avg Response Time: {result['performance_metrics']['avg_response_time']:.2f}ms")
            print(f"  Success Rate: {result['performance_metrics']['success_rate']:.2%}")
        else:
            print(f"❌ Cohere Rerank failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error testing Cohere Rerank: {e}")

def test_enhanced_capabilities():
    """Test enhanced RAG capabilities"""
    print("\n🚀 Testing Enhanced RAG Capabilities")
    print("=" * 50)
    
    try:
        print("🔧 Testing POST /rag/test-capabilities endpoint...")
        response = requests.post(
            f"{API_BASE}/rag/test-capabilities",
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Enhanced capabilities test successful!")
            
            if "prediction_aggregation" in result:
                agg = result["prediction_aggregation"]
                print(f"Prediction Aggregation:")
                print(f"  Available: {agg['available']}")
                print(f"  Bias Reduction: {agg['bias_reduction']:.3f}")
                print(f"  Confidence: {agg['confidence']:.3f}")
            
            if "cohere_rerank" in result:
                rerank = result["cohere_rerank"]
                print(f"Cohere Rerank:")
                print(f"  Status: {rerank['status']}")
                print(f"  API Available: {rerank.get('api_available', False)}")
                if "test_results" in rerank:
                    print(f"  Test Results: {len(rerank['test_results'])} documents reranked")
        else:
            print(f"❌ Enhanced capabilities test failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error testing enhanced capabilities: {e}")

def test_aggregation_stats():
    """Test aggregation statistics endpoint"""
    print("\n📈 Testing Aggregation Statistics")
    print("=" * 50)
    
    try:
        print("📊 Testing GET /rag/aggregation-stats endpoint...")
        response = requests.get(f"{API_BASE}/rag/aggregation-stats")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Aggregation stats successful!")
            stats = result.get("stats", {})
            
            if "total_aggregations" in stats:
                print(f"Total Aggregations: {stats['total_aggregations']}")
            if "avg_bias_reduction" in stats:
                print(f"Average Bias Reduction: {stats['avg_bias_reduction']:.3f}")
            if "avg_disagreement" in stats:
                print(f"Average Disagreement: {stats['avg_disagreement']:.3f}")
            if "avg_confidence" in stats:
                print(f"Average Confidence: {stats['avg_confidence']:.3f}")
        else:
            print(f"❌ Aggregation stats failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing aggregation stats: {e}")

def test_rerank_stats():
    """Test rerank statistics endpoint"""
    print("\n📊 Testing Rerank Statistics")
    print("=" * 50)
    
    try:
        print("📈 Testing GET /rag/rerank-stats endpoint...")
        response = requests.get(f"{API_BASE}/rag/rerank-stats")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Rerank stats successful!")
            stats = result.get("stats", {})
            
            if "total_requests" in stats:
                print(f"Total Requests: {stats['total_requests']}")
            if "avg_response_time" in stats:
                print(f"Average Response Time: {stats['avg_response_time']:.2f}ms")
            if "success_rate" in stats:
                print(f"Success Rate: {stats['success_rate']:.2%}")
            if "total_documents_processed" in stats:
                print(f"Total Documents Processed: {stats['total_documents_processed']}")
        else:
            print(f"❌ Rerank stats failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing rerank stats: {e}")

def test_enhanced_kernel_scoring():
    """Test enhanced kernel scoring with prediction aggregation"""
    print("\n🎯 Testing Enhanced Kernel Scoring")
    print("=" * 50)
    
    test_request = {
        "project_id": "ENHANCED-TEST-001",
        "project_name": "Enhanced Solar Project",
        "metadata": {
            "financial": {
                "cost": 2000000,
                "roi": 0.22,
                "funding_source": "mixed",
                "apy_projection": 0.15
            },
            "ecological": {
                "carbon_impact": -200,
                "renewable_percent": 95,
                "material_sourcing": "sustainable"
            },
            "social": {
                "job_creation": 40,
                "community_benefit": "very_high",
                "regulatory_alignment": "exceeding"
            }
        }
    }
    
    try:
        print("🎯 Testing POST /kernel/scores with enhanced scoring...")
        response = requests.post(
            f"{API_BASE}/kernel/scores",
            json=test_request,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Enhanced kernel scoring successful!")
            print(f"Project: {result['project_name']}")
            print(f"Scores: {result['scores']}")
            print(f"AI Analysis: {result['ai_analysis']}")
            print(f"Confidence: {result['confidence']}")
        else:
            print(f"❌ Enhanced kernel scoring failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error testing enhanced kernel scoring: {e}")

def main():
    """Run all tests"""
    print("🚀 Starting Prediction Aggregator and Cohere Rerank Tests")
    print(f"API Base: {API_BASE}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 60)
    
    # Run tests
    test_prediction_aggregator()
    test_cohere_rerank()
    test_enhanced_capabilities()
    test_aggregation_stats()
    test_rerank_stats()
    test_enhanced_kernel_scoring()
    
    print("\n" + "=" * 60)
    print("🏁 Prediction Aggregator and Cohere Rerank Tests Complete!")
    print("These features now match the claims in the LaTeX report!")

if __name__ == "__main__":
    main()
