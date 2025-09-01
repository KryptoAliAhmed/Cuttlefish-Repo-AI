#!/usr/bin/env python3
"""
RAG System Diagnostic Tool
Helps identify and fix issues with your RAG system
"""

import requests
import json
import sys
from typing import Dict, Any, List

class RAGDiagnostic:
    def __init__(self, base_url: str = "http://localhost:5002"):
        self.base_url = base_url
        self.session = requests.Session()
    
    def test_connection(self) -> bool:
        """Test if the RAG API is accessible."""
        try:
            response = self.session.get(f"{self.base_url}/api/status")
            if response.status_code == 200:
                print("✅ RAG API is accessible")
                return True
            else:
                print(f"❌ RAG API returned status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Cannot connect to RAG API: {e}")
            return False
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get current system status."""
        try:
            response = self.session.get(f"{self.base_url}/api/status")
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"Status {response.status_code}"}
        except Exception as e:
            return {"error": str(e)}
    
    def get_document_stats(self) -> Dict[str, Any]:
        """Get detailed document statistics."""
        try:
            response = self.session.get(f"{self.base_url}/api/document-stats")
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"Status {response.status_code}"}
        except Exception as e:
            return {"error": str(e)}
    
    def test_query(self, question: str) -> Dict[str, Any]:
        """Test a specific query and analyze the response."""
        try:
            response = self.session.post(
                f"{self.base_url}/api/chat",
                json={"question": question, "mode": "default"}
            )
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"Status {response.status_code}"}
        except Exception as e:
            return {"error": str(e)}
    
    def search_documents(self, query: str, top_k: int = 5) -> Dict[str, Any]:
        """Search documents and get detailed results."""
        try:
            response = self.session.post(
                f"{self.base_url}/api/search",
                json={"query": query, "top_k": top_k}
            )
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"Status {response.status_code}"}
        except Exception as e:
            return {"error": str(e)}
    
    def run_full_diagnostic(self):
        """Run a comprehensive diagnostic of the RAG system."""
        print("🔍 RAG System Diagnostic")
        print("=" * 50)
        
        # Test connection
        if not self.test_connection():
            print("\n❌ Cannot proceed with diagnostic - API not accessible")
            return
        
        # Get system status
        print("\n📊 System Status:")
        status = self.get_system_status()
        if "error" not in status:
            print(f"  Documents loaded: {status.get('documents_loaded', 0)}")
            print(f"  Index ready: {status.get('index_ready', False)}")
            print(f"  API configured: {status.get('api_configured', False)}")
        else:
            print(f"  Error: {status['error']}")
        
        # Get document statistics
        print("\n📈 Document Statistics:")
        stats = self.get_document_stats()
        if "error" not in stats:
            data = stats.get("data", {})
            print(f"  Total documents: {data.get('total_documents', 0)}")
            print(f"  Total chunks: {data.get('total_chunks', 0)}")
            print(f"  Unique sources: {data.get('unique_sources', 0)}")
            print(f"  Average chunk length: {data.get('average_chunk_length', 0):.0f} characters")
            
            # Show source distribution
            source_dist = data.get('source_distribution', {})
            if source_dist:
                print("  Source distribution:")
                for source, count in list(source_dist.items())[:5]:  # Show top 5
                    print(f"    {source}: {count} chunks")
        else:
            print(f"  Error: {stats['error']}")
        
        # Test specific queries
        test_queries = [
            "What is Nature Stewardship AI Framework?",
            "Tell me about carbon offset initiatives",
            "What are the main features of this system?",
            "Explain the staking mechanism",
            "What is ESG compliance?"
        ]
        
        print("\n🧪 Query Testing:")
        for query in test_queries:
            print(f"\n  Query: {query}")
            result = self.test_query(query)
            
            if "error" not in result:
                answer = result.get("answer", "")
                source = result.get("source", "Unknown")
                confidence = result.get("confidence", 0)
                
                print(f"    Answer: {answer[:100]}{'...' if len(answer) > 100 else ''}")
                print(f"    Source: {source}")
                print(f"    Confidence: {confidence:.1%}")
                
                # Analyze answer quality
                if "no information" in answer.lower() or "not found" in answer.lower():
                    print("    ⚠️  Low relevance detected")
                elif confidence < 0.5:
                    print("    ⚠️  Low confidence detected")
                elif source == "Unknown":
                    print("    ⚠️  Unknown source detected")
                else:
                    print("    ✅ Good response")
            else:
                print(f"    Error: {result['error']}")
        
        # Search analysis
        print("\n🔍 Search Analysis:")
        search_query = "Nature Stewardship AI Framework"
        search_results = self.search_documents(search_query, top_k=3)
        
        if "error" not in search_results:
            results = search_results.get("results", [])
            print(f"  Found {len(results)} results for '{search_query}':")
            
            for i, result in enumerate(results):
                content = result.get("content", "")
                source = result.get("source", "Unknown")
                confidence = result.get("confidence", 0)
                distance = result.get("distance", 1.0)
                
                print(f"    Result {i+1}:")
                print(f"      Source: {source}")
                print(f"      Confidence: {confidence:.1%}")
                print(f"      Distance: {distance:.3f}")
                print(f"      Content: {content[:150]}{'...' if len(content) > 150 else ''}")
        else:
            print(f"  Error: {search_results['error']}")
        
        print("\n" + "=" * 50)
        print("Diagnostic complete!")

def main():
    """Main function to run the diagnostic."""
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = "http://localhost:5002"
    
    diagnostic = RAGDiagnostic(base_url)
    diagnostic.run_full_diagnostic()

if __name__ == "__main__":
    main()
