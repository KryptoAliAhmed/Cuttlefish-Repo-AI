#!/usr/bin/env python3
"""
Cohere Rerank Integration for Enhanced RAG
Provides semantic re-ranking capabilities using Cohere's rerank API
"""

import os
import json
import logging
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import requests
import numpy as np
from datetime import datetime

logger = logging.getLogger(__name__)

@dataclass
class RerankResult:
    """Result from Cohere rerank operation"""
    document: str
    relevance_score: float
    original_index: int
    rerank_rank: int
    metadata: Dict[str, Any] = None

@dataclass
class RerankRequest:
    """Request for reranking operation"""
    query: str
    documents: List[str]
    top_n: int = 10
    model: str = "rerank-english-v2.0"
    return_metadata: bool = True
    max_chunks_per_doc: int = 10

class CohereReranker:
    """Cohere Rerank integration for semantic re-ranking"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("COHERE_API_KEY")
        self.base_url = "https://api.cohere.ai/v1"
        self.default_model = "rerank-english-v2.0"
        self.rerank_history = []
        self.performance_metrics = {
            "total_requests": 0,
            "avg_response_time": 0.0,
            "success_rate": 0.0,
            "total_documents_processed": 0
        }
        
    async def rerank_documents(
        self, 
        query: str, 
        documents: List[str],
        top_n: int = 10,
        model: str = None,
        return_metadata: bool = True
    ) -> List[RerankResult]:
        """Rerank documents based on query relevance"""
        try:
            start_time = asyncio.get_event_loop().time()
            
            if not self.api_key:
                logger.warning("Cohere API key not found, using fallback reranking")
                return await self._fallback_rerank(query, documents, top_n)
            
            # Prepare request
            request_data = {
                "query": query,
                "documents": documents,
                "top_n": min(top_n, len(documents)),
                "model": model or self.default_model,
                "return_metadata": return_metadata
            }
            
            # Make API call
            response = await self._call_cohere_api(request_data)
            
            # Process results
            results = self._process_rerank_response(response, documents)
            
            # Track metrics
            await self._track_rerank_metrics(start_time, len(documents), True)
            
            return results
            
        except Exception as e:
            logger.error(f"Cohere rerank failed: {e}")
            await self._track_rerank_metrics(0, len(documents), False)
            return await self._fallback_rerank(query, documents, top_n)
    
    async def _call_cohere_api(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Make API call to Cohere rerank endpoint"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        url = f"{self.base_url}/rerank"
        
        try:
            # Use aiohttp for async HTTP requests
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=request_data) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        error_text = await response.text()
                        raise Exception(f"Cohere API error: {response.status} - {error_text}")
                        
        except ImportError:
            # Fallback to requests if aiohttp not available
            response = requests.post(url, headers=headers, json=request_data)
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"Cohere API error: {response.status_code} - {response.text}")
    
    def _process_rerank_response(self, response: Dict[str, Any], original_docs: List[str]) -> List[RerankResult]:
        """Process Cohere rerank response"""
        results = []
        
        if "results" not in response:
            logger.error("Invalid Cohere response format")
            return results
        
        for i, result in enumerate(response["results"]):
            try:
                rerank_result = RerankResult(
                    document=result.get("document", {}).get("text", ""),
                    relevance_score=result.get("relevance_score", 0.0),
                    original_index=result.get("index", i),
                    rerank_rank=i + 1,
                    metadata=result.get("metadata", {})
                )
                results.append(rerank_result)
            except Exception as e:
                logger.error(f"Error processing rerank result {i}: {e}")
        
        return results
    
    async def _fallback_rerank(
        self, 
        query: str, 
        documents: List[str], 
        top_n: int
    ) -> List[RerankResult]:
        """Fallback reranking when Cohere API is unavailable"""
        logger.info("Using fallback reranking algorithm")
        
        # Simple TF-IDF based reranking
        results = []
        query_terms = set(query.lower().split())
        
        for i, doc in enumerate(documents):
            doc_terms = set(doc.lower().split())
            
            # Calculate simple relevance score
            intersection = len(query_terms.intersection(doc_terms))
            union = len(query_terms.union(doc_terms))
            
            if union > 0:
                relevance_score = intersection / union
            else:
                relevance_score = 0.0
            
            # Add length penalty for very short documents
            if len(doc.split()) < 5:
                relevance_score *= 0.5
            
            results.append(RerankResult(
                document=doc,
                relevance_score=relevance_score,
                original_index=i,
                rerank_rank=0,  # Will be set after sorting
                metadata={"method": "fallback_tfidf"}
            ))
        
        # Sort by relevance score
        results.sort(key=lambda x: x.relevance_score, reverse=True)
        
        # Update rerank ranks
        for i, result in enumerate(results[:top_n]):
            result.rerank_rank = i + 1
        
        return results[:top_n]
    
    async def _track_rerank_metrics(self, start_time: float, num_docs: int, success: bool):
        """Track reranking performance metrics"""
        if start_time > 0:
            response_time = (asyncio.get_event_loop().time() - start_time) * 1000
        else:
            response_time = 0
        
        # Update metrics
        self.performance_metrics["total_requests"] += 1
        self.performance_metrics["total_documents_processed"] += num_docs
        
        # Update average response time
        current_avg = self.performance_metrics["avg_response_time"]
        total_requests = self.performance_metrics["total_requests"]
        self.performance_metrics["avg_response_time"] = (
            (current_avg * (total_requests - 1) + response_time) / total_requests
        )
        
        # Update success rate
        if success:
            current_success = self.performance_metrics["success_rate"] * (total_requests - 1)
            self.performance_metrics["success_rate"] = (current_success + 1) / total_requests
        
        # Store in history
        self.rerank_history.append({
            "timestamp": datetime.now().isoformat(),
            "num_documents": num_docs,
            "response_time_ms": response_time,
            "success": success
        })
        
        # Keep only last 100 entries
        if len(self.rerank_history) > 100:
            self.rerank_history.pop(0)
    
    async def rerank_with_context(
        self, 
        query: str, 
        documents: List[str],
        context: Dict[str, Any] = None,
        top_n: int = 10
    ) -> List[RerankResult]:
        """Rerank documents with additional context"""
        try:
            # Enhance query with context
            enhanced_query = self._enhance_query_with_context(query, context)
            
            # Perform reranking
            results = await self.rerank_documents(enhanced_query, documents, top_n)
            
            # Apply context-based adjustments
            if context:
                results = await self._apply_context_adjustments(results, context)
            
            return results
            
        except Exception as e:
            logger.error(f"Context-aware reranking failed: {e}")
            return await self.rerank_documents(query, documents, top_n)
    
    def _enhance_query_with_context(self, query: str, context: Dict[str, Any] = None) -> str:
        """Enhance query with context information"""
        if not context:
            return query
        
        enhanced_parts = [query]
        
        # Add relevant context fields
        if "project_type" in context:
            enhanced_parts.append(f"Project type: {context['project_type']}")
        
        if "domain" in context:
            enhanced_parts.append(f"Domain: {context['domain']}")
        
        if "keywords" in context:
            enhanced_parts.append(f"Keywords: {', '.join(context['keywords'])}")
        
        if "esg_focus" in context:
            enhanced_parts.append(f"ESG focus: {context['esg_focus']}")
        
        return " ".join(enhanced_parts)
    
    async def _apply_context_adjustments(
        self, 
        results: List[RerankResult], 
        context: Dict[str, Any]
    ) -> List[RerankResult]:
        """Apply context-based adjustments to rerank results"""
        adjusted_results = []
        
        for result in results:
            adjusted_score = result.relevance_score
            
            # Boost documents that match context
            if "esg_focus" in context:
                esg_focus = context["esg_focus"].lower()
                doc_lower = result.document.lower()
                
                if esg_focus in doc_lower:
                    adjusted_score *= 1.2  # 20% boost
            
            # Boost documents with recent information
            if "prefer_recent" in context and context["prefer_recent"]:
                if "2024" in result.document or "2025" in result.document:
                    adjusted_score *= 1.1  # 10% boost
            
            # Create adjusted result
            adjusted_result = RerankResult(
                document=result.document,
                relevance_score=adjusted_score,
                original_index=result.original_index,
                rerank_rank=result.rerank_rank,
                metadata={**result.metadata, "context_adjusted": True}
            )
            
            adjusted_results.append(adjusted_result)
        
        # Re-sort by adjusted scores
        adjusted_results.sort(key=lambda x: x.relevance_score, reverse=True)
        
        # Update ranks
        for i, result in enumerate(adjusted_results):
            result.rerank_rank = i + 1
        
        return adjusted_results
    
    async def batch_rerank(
        self, 
        queries: List[str], 
        documents: List[str],
        top_n: int = 10
    ) -> Dict[str, List[RerankResult]]:
        """Perform batch reranking for multiple queries"""
        results = {}
        
        for query in queries:
            try:
                query_results = await self.rerank_documents(query, documents, top_n)
                results[query] = query_results
            except Exception as e:
                logger.error(f"Batch rerank failed for query '{query}': {e}")
                results[query] = []
        
        return results
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        return {
            **self.performance_metrics,
            "recent_requests": len(self.rerank_history),
            "avg_documents_per_request": (
                self.performance_metrics["total_documents_processed"] / 
                max(self.performance_metrics["total_requests"], 1)
            ),
            "last_10_performance": self.rerank_history[-10:] if self.rerank_history else []
        }
    
    async def test_rerank_capability(self) -> Dict[str, Any]:
        """Test Cohere rerank capability"""
        test_query = "solar energy project ESG analysis"
        test_documents = [
            "This document discusses solar energy projects and their environmental impact.",
            "Financial analysis of renewable energy investments.",
            "Social benefits of community solar programs.",
            "Technical specifications for photovoltaic systems.",
            "ESG scoring methodology for infrastructure projects."
        ]
        
        try:
            results = await self.rerank_documents(test_query, test_documents, top_n=3)
            
            return {
                "status": "success",
                "api_available": True,
                "test_results": [
                    {
                        "rank": r.rerank_rank,
                        "score": r.relevance_score,
                        "document_preview": r.document[:100] + "..."
                    } for r in results
                ]
            }
            
        except Exception as e:
            return {
                "status": "failed",
                "api_available": False,
                "error": str(e),
                "fallback_used": True
            }

# Global instance for easy access
cohere_reranker = CohereReranker()
