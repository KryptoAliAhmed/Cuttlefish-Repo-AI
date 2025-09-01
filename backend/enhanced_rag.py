"""
Enhanced RAG System with Semantic Re-ranking, Multi-Agent Orchestration, and Evaluation
"""

import re
import time
import json
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

# === Semantic Re-ranking Layer ===
class SemanticReranker:
    def __init__(self, documents: List[str], chunk_sources: List[str]):
        self.documents = documents
        self.chunk_sources = chunk_sources
        self.tfidf_vectorizer = None
        self.tfidf_matrix = None
        self._build_tfidf_index()
    
    def _build_tfidf_index(self):
        """Build TF-IDF index for keyword-based retrieval."""
        if not self.documents:
            return
        
        # Preprocess documents for TF-IDF
        processed_docs = []
        for doc in self.documents:
            # Remove markdown and special characters
            cleaned = re.sub(r'[^\w\s]', ' ', doc)
            cleaned = re.sub(r'\s+', ' ', cleaned).strip().lower()
            processed_docs.append(cleaned)
        
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=10000,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=2
        )
        self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(processed_docs)
    
    def hybrid_search(self, query: str, k: int = 10, semantic_weight: float = 0.7) -> List[tuple]:
        """
        Perform hybrid search combining semantic and keyword-based retrieval.
        
        Args:
            query: Search query
            k: Number of results to return
            semantic_weight: Weight for semantic similarity (0-1)
        
        Returns:
            List of (document_index, combined_score, semantic_score, keyword_score)
        """
        if not self.documents or not self.tfidf_matrix:
            return []
        
        # 1. Semantic search using embeddings
        semantic_scores = self._semantic_search(query)
        
        # 2. Keyword search using TF-IDF
        keyword_scores = self._keyword_search(query)
        
        # 3. Combine scores
        combined_scores = []
        for i in range(len(self.documents)):
            semantic_score = semantic_scores.get(i, 0.0)
            keyword_score = keyword_scores.get(i, 0.0)
            
            # Normalize scores to 0-1 range
            combined_score = (semantic_weight * semantic_score + 
                            (1 - semantic_weight) * keyword_score)
            
            combined_scores.append((i, combined_score, semantic_score, keyword_score))
        
        # Sort by combined score and return top k
        combined_scores.sort(key=lambda x: x[1], reverse=True)
        return combined_scores[:k]
    
    def _semantic_search(self, query: str) -> Dict[int, float]:
        """Perform semantic search using embeddings."""
        # This would integrate with the main RAG system
        # For now, return placeholder
        return {}
    
    def _keyword_search(self, query: str) -> Dict[int, float]:
        """Perform keyword search using TF-IDF."""
        if not self.tfidf_vectorizer or not self.tfidf_matrix:
            return {}
        
        # Preprocess query
        cleaned_query = re.sub(r'[^\w\s]', ' ', query)
        cleaned_query = re.sub(r'\s+', ' ', cleaned_query).strip().lower()
        
        # Transform query to TF-IDF vector
        query_vector = self.tfidf_vectorizer.transform([cleaned_query])
        
        # Calculate cosine similarity
        similarities = cosine_similarity(query_vector, self.tfidf_matrix).flatten()
        
        # Convert to dictionary
        keyword_scores = {}
        for i, score in enumerate(similarities):
            if score > 0:  # Only include positive similarities
                keyword_scores[i] = float(score)
        
        return keyword_scores
    
    def rerank_results(self, initial_results: List[tuple], query: str, 
                      diversity_weight: float = 0.3) -> List[tuple]:
        """
        Rerank results to improve diversity and relevance.
        
        Args:
            initial_results: List of (doc_index, score, semantic_score, keyword_score)
            query: Original query
            diversity_weight: Weight for diversity penalty
        
        Returns:
            Reranked list of results
        """
        if not initial_results:
            return []
        
        reranked = []
        used_content = set()
        
        for doc_idx, combined_score, semantic_score, keyword_score in initial_results:
            if doc_idx >= len(self.documents):
                continue
            
            # Calculate diversity penalty
            doc_content = self.documents[doc_idx][:100].lower()  # First 100 chars
            diversity_penalty = 0.0
            
            if used_content:
                # Check overlap with already selected documents
                for used in used_content:
                    overlap = self._calculate_overlap(doc_content, used)
                    diversity_penalty += overlap * diversity_weight
            
            # Apply diversity penalty
            final_score = combined_score * (1 - diversity_penalty)
            
            reranked.append((doc_idx, final_score, semantic_score, keyword_score))
            used_content.add(doc_content)
        
        # Sort by final score
        reranked.sort(key=lambda x: x[1], reverse=True)
        return reranked
    
    def _calculate_overlap(self, text1: str, text2: str) -> float:
        """Calculate text overlap between two strings."""
        words1 = set(text1.split())
        words2 = set(text2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0

# === Multi-Agent Orchestrator ===
class AgentOrchestrator:
    def __init__(self):
        self.agents = {}
        self.conversation_history = []
        self.current_task = None
    
    def register_agent(self, agent_id: str, agent_type: str, capabilities: List[str]):
        """Register a new agent."""
        self.agents[agent_id] = {
            "type": agent_type,
            "capabilities": capabilities,
            "status": "idle",
            "history": []
        }
    
    def orchestrate_task(self, task: str, context: str, llm_client=None) -> Dict[str, Any]:
        """Orchestrate a task across multiple agents."""
        self.current_task = task
        
        # 1. Task Analysis Agent
        analysis_result = self._analyze_task(task, context, llm_client)
        
        # 2. Research Agent
        research_result = self._research_context(task, context)
        
        # 3. Synthesis Agent
        synthesis_result = self._synthesize_results(analysis_result, research_result, llm_client)
        
        # 4. Validation Agent
        validation_result = self._validate_output(synthesis_result, llm_client)
        
        return {
            "task": task,
            "analysis": analysis_result,
            "research": research_result,
            "synthesis": synthesis_result,
            "validation": validation_result,
            "final_output": validation_result.get("validated_output", synthesis_result.get("synthesis", ""))
        }
    
    def _analyze_task(self, task: str, context: str, llm_client=None) -> Dict[str, Any]:
        """Task analysis using specialized agent."""
        prompt = f"""
TASK ANALYSIS AGENT:
Analyze the following task and provide:
1. Task type and complexity
2. Required information
3. Potential challenges
4. Recommended approach

TASK: {task}
CONTEXT: {context}

Provide a structured analysis.
"""
        
        # Use LLM for task analysis
        if llm_client:
            try:
                response = llm_client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "You are a task analysis specialist."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=500,
                    temperature=0.3
                )
                analysis = response.choices[0].message.content
            except Exception as e:
                analysis = f"Analysis failed: {str(e)}"
        else:
            analysis = "LLM not available for analysis"
        
        return {
            "task_type": "complex_analysis",
            "complexity": "high",
            "analysis": analysis,
            "agent": "task_analyzer"
        }
    
    def _research_context(self, task: str, context: str) -> Dict[str, Any]:
        """Research context using RAG system."""
        # This would integrate with the main RAG system
        return {
            "research_findings": f"Research findings for: {task}",
            "sources": ["knowledge_base"],
            "confidence": 0.8,
            "agent": "researcher"
        }
    
    def _synthesize_results(self, analysis: Dict, research: Dict, llm_client=None) -> Dict[str, Any]:
        """Synthesize results from multiple agents."""
        synthesis_prompt = f"""
SYNTHESIS AGENT:
Combine the following analysis and research into a coherent response:

ANALYSIS:
{analysis.get('analysis', 'No analysis available')}

RESEARCH:
{research.get('research_findings', 'No research available')}

Provide a synthesized, well-structured response that addresses the original task.
"""
        
        if llm_client:
            try:
                response = llm_client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "You are a synthesis specialist."},
                        {"role": "user", "content": synthesis_prompt}
                    ],
                    max_tokens=1000,
                    temperature=0.4
                )
                synthesis = response.choices[0].message.content
            except Exception as e:
                synthesis = f"Synthesis failed: {str(e)}"
        else:
            synthesis = "LLM not available for synthesis"
        
        return {
            "synthesis": synthesis,
            "agent": "synthesizer"
        }
    
    def _validate_output(self, synthesis: Dict, llm_client=None) -> Dict[str, Any]:
        """Validate the synthesized output."""
        validation_prompt = f"""
VALIDATION AGENT:
Validate the following synthesized output for:
1. Accuracy and completeness
2. Logical coherence
3. Relevance to the original task
4. Professional quality

OUTPUT:
{synthesis.get('synthesis', 'No synthesis available')}

Provide validation feedback and any necessary corrections.
"""
        
        if llm_client:
            try:
                response = llm_client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "You are a validation specialist."},
                        {"role": "user", "content": validation_prompt}
                    ],
                    max_tokens=500,
                    temperature=0.2
                )
                validation = response.choices[0].message.content
                is_valid = "valid" in validation.lower() or "good" in validation.lower()
            except Exception as e:
                validation = f"Validation failed: {str(e)}"
                is_valid = False
        else:
            validation = "LLM not available for validation"
            is_valid = True
        
        return {
            "validation_feedback": validation,
            "is_valid": is_valid,
            "validated_output": synthesis.get("synthesis", ""),
            "agent": "validator"
        }

# === Evaluation Pipeline ===
class EvaluationMetrics(BaseModel):
    response_time: float
    relevance_score: float
    completeness_score: float
    accuracy_score: float
    user_satisfaction: Optional[float] = None

class EvaluationRequest(BaseModel):
    query: str
    expected_response: str
    context: str = ""

class EvaluationResponse(BaseModel):
    metrics: EvaluationMetrics
    detailed_analysis: Dict[str, Any]
    recommendations: List[str]

class Evaluator:
    def __init__(self):
        pass
    
    def evaluate_response(self, query: str, actual_response: str, expected_response: str) -> EvaluationResponse:
        """Evaluate response quality and provide metrics."""
        start_time = time.time()
        
        # Calculate metrics
        relevance_score = self._calculate_relevance(query, actual_response)
        completeness_score = self._calculate_completeness(expected_response, actual_response)
        accuracy_score = self._calculate_accuracy(expected_response, actual_response)
        
        metrics = EvaluationMetrics(
            response_time=time.time() - start_time,
            relevance_score=relevance_score,
            completeness_score=completeness_score,
            accuracy_score=accuracy_score
        )
        
        # Detailed analysis
        analysis = {
            "query_complexity": self._analyze_query_complexity(query),
            "response_quality": self._analyze_response_quality(actual_response)
        }
        
        # Generate recommendations
        recommendations = self._generate_recommendations(metrics, analysis)
        
        return EvaluationResponse(
            metrics=metrics,
            detailed_analysis=analysis,
            recommendations=recommendations
        )
    
    def _calculate_relevance(self, query: str, response: str) -> float:
        """Calculate relevance score between query and response."""
        # Simple keyword overlap for now
        query_words = set(query.lower().split())
        response_words = set(response.lower().split())
        
        if not query_words:
            return 0.0
        
        overlap = len(query_words.intersection(response_words))
        return min(1.0, overlap / len(query_words))
    
    def _calculate_completeness(self, expected: str, actual: str) -> float:
        """Calculate completeness score."""
        # Compare length and content coverage
        expected_length = len(expected)
        actual_length = len(actual)
        
        if expected_length == 0:
            return 1.0
        
        length_ratio = min(1.0, actual_length / expected_length)
        
        # Content similarity
        expected_words = set(expected.lower().split())
        actual_words = set(actual.lower().split())
        
        if not expected_words:
            return 1.0
        
        content_coverage = len(expected_words.intersection(actual_words)) / len(expected_words)
        
        return (length_ratio + content_coverage) / 2
    
    def _calculate_accuracy(self, expected: str, actual: str) -> float:
        """Calculate accuracy score."""
        # Simple similarity for now
        expected_words = set(expected.lower().split())
        actual_words = set(actual.lower().split())
        
        if not expected_words:
            return 1.0
        
        intersection = len(expected_words.intersection(actual_words))
        return intersection / len(expected_words)
    
    def _analyze_query_complexity(self, query: str) -> Dict[str, Any]:
        """Analyze query complexity."""
        words = query.split()
        return {
            "word_count": len(words),
            "complexity": "high" if len(words) > 10 else "medium" if len(words) > 5 else "low",
            "has_technical_terms": any(word in query.lower() for word in ["api", "integration", "architecture", "deployment"])
        }
    
    def _analyze_response_quality(self, response: str) -> Dict[str, Any]:
        """Analyze response quality."""
        return {
            "length": len(response),
            "has_structure": any(marker in response for marker in ["##", "-", "1.", "•"]),
            "has_code": "```" in response,
            "has_links": "http" in response
        }
    
    def _generate_recommendations(self, metrics: EvaluationMetrics, analysis: Dict[str, Any]) -> List[str]:
        """Generate improvement recommendations."""
        recommendations = []
        
        if metrics.response_time > 5.0:
            recommendations.append("Consider optimizing response time through caching or model selection")
        
        if metrics.relevance_score < 0.7:
            recommendations.append("Improve query understanding and context retrieval")
        
        if metrics.completeness_score < 0.8:
            recommendations.append("Enhance response completeness through better prompt engineering")
        
        if metrics.accuracy_score < 0.8:
            recommendations.append("Improve accuracy through better training data or model fine-tuning")
        
        return recommendations

# === Document Ingestion Widget ===
class DocumentIngestionRequest(BaseModel):
    file_content: str
    file_name: str
    file_type: str
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class DocumentIngestionResponse(BaseModel):
    status: str
    document_id: str
    chunks_created: int
    processing_time: float
    quality_score: float
    suggestions: List[str]

class DocumentProcessor:
    def __init__(self):
        pass
    
    def process_document(self, request: DocumentIngestionRequest) -> DocumentIngestionResponse:
        """Process document with quality analysis."""
        start_time = time.time()
        
        # Process document
        processed_text = self._process_document_content(
            request.file_content, 
            request.file_type
        )
        
        # Create chunks with semantic boundaries
        chunks = self._create_semantic_chunks(processed_text)
        
        # Analyze document quality
        quality_analysis = self._analyze_document_quality(processed_text, chunks)
        
        processing_time = time.time() - start_time
        
        return DocumentIngestionResponse(
            status="success",
            document_id=f"doc_{int(time.time())}",
            chunks_created=len(chunks),
            processing_time=processing_time,
            quality_score=quality_analysis["score"],
            suggestions=quality_analysis["suggestions"]
        )
    
    def _process_document_content(self, content: str, file_type: str) -> str:
        """Process document content based on type."""
        if file_type == "markdown":
            return content
        elif file_type == "json":
            try:
                data = json.loads(content)
                return json.dumps(data, indent=2)
            except:
                return content
        else:
            return content
    
    def _create_semantic_chunks(self, text: str) -> List[str]:
        """Create semantically meaningful chunks."""
        # Split by headers, sections, or paragraphs
        chunks = []
        
        # Split by markdown headers
        if "#" in text:
            sections = re.split(r'(^#+\s+.+$)', text, flags=re.MULTILINE)
            current_chunk = ""
            
            for section in sections:
                if section.strip():
                    if section.startswith("#"):
                        # New section
                        if current_chunk:
                            chunks.append(current_chunk.strip())
                        current_chunk = section + "\n"
                    else:
                        current_chunk += section
            
            if current_chunk:
                chunks.append(current_chunk.strip())
        
        # Fallback to paragraph splitting
        if not chunks:
            paragraphs = text.split("\n\n")
            for para in paragraphs:
                if len(para.strip()) > 50:  # Minimum chunk size
                    chunks.append(para.strip())
        
        return chunks
    
    def _analyze_document_quality(self, text: str, chunks: List[str]) -> Dict[str, Any]:
        """Analyze document quality and provide suggestions."""
        analysis = {
            "score": 0.0,
            "suggestions": []
        }
        
        # Calculate quality metrics
        total_length = len(text)
        chunk_count = len(chunks)
        avg_chunk_length = sum(len(chunk) for chunk in chunks) / max(chunk_count, 1)
        
        # Quality scoring
        length_score = min(1.0, total_length / 1000)  # Prefer longer documents
        chunk_score = min(1.0, chunk_count / 5)  # Prefer more chunks
        balance_score = 1.0 - abs(avg_chunk_length - 500) / 500  # Prefer balanced chunks
        
        analysis["score"] = (length_score + chunk_score + balance_score) / 3
        
        # Generate suggestions
        if total_length < 500:
            analysis["suggestions"].append("Consider adding more content for better retrieval")
        
        if chunk_count < 3:
            analysis["suggestions"].append("Document could benefit from more structured sections")
        
        if avg_chunk_length > 1000:
            analysis["suggestions"].append("Consider breaking down large sections for better granularity")
        
        return analysis

# === Streaming Transcription Enhancement ===
class StreamingTranscription:
    def __init__(self):
        self.active_sessions = {}
    
    async def stream_transcription(self, audio_stream, session_id: str):
        """Stream transcription results in real-time."""
        try:
            # Process audio in chunks
            async for chunk in audio_stream:
                # Process chunk and get partial transcription
                partial_text = await self._process_audio_chunk(chunk)
                
                # Yield partial result
                yield f"data: {json.dumps({'partial': partial_text, 'session_id': session_id})}\n\n"
            
            # Final transcription
            final_text = await self._get_final_transcription(session_id)
            yield f"data: {json.dumps({'final': final_text, 'session_id': session_id})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e), 'session_id': session_id})}\n\n"
    
    async def _process_audio_chunk(self, chunk: bytes) -> str:
        """Process a single audio chunk."""
        # This would integrate with real-time STT service
        # For now, return placeholder
        return "Processing..."
    
    async def _get_final_transcription(self, session_id: str) -> str:
        """Get final transcription for session."""
        # This would get the complete transcription
        return "Final transcription"

# === Enhanced RAG Functions ===
def answer_question_with_reranking(question: str, documents: List[str], chunk_sources: List[str], 
                                 rerank: bool = True) -> Tuple[str, Optional[str], float, Dict]:
    """Enhanced answer function with semantic re-ranking."""
    if not documents:
        return "No documents loaded. Please add documents first.", None, 1.0, {}
    
    # Initialize reranker if needed
    if rerank:
        reranker = SemanticReranker(documents, chunk_sources)
        search_results = reranker.hybrid_search(question, k=15)
        reranked_results = reranker.rerank_results(search_results, question)
        
        # Get top results
        top_indices = [idx for idx, _, _, _ in reranked_results[:5]]
        relevant_docs = [documents[idx] for idx in top_indices if idx < len(documents)]
        
        # Get source from best match
        best_idx = top_indices[0] if top_indices else 0
        source = chunk_sources[best_idx] if best_idx < len(chunk_sources) else "Unknown"
        
        # Calculate confidence from best semantic score
        best_semantic_score = reranked_results[0][2] if reranked_results else 0.0
        confidence = best_semantic_score
    else:
        # Fallback to simple search
        relevant_docs = documents[:3]  # Simple fallback
        source = chunk_sources[0] if chunk_sources else "Unknown"
        confidence = 0.5
    
    # Combine context from multiple relevant documents
    combined_context = "\n\n".join(relevant_docs)
    
    # Generate answer using LLM (placeholder)
    answer = f"Enhanced response for: {question}\n\nContext: {combined_context[:200]}..."
    
    # Return enhanced response with metadata
    metadata = {
        "reranked": rerank,
        "search_results": len(reranked_results) if rerank else 0,
        "semantic_score": best_semantic_score if rerank else 0.0,
        "diversity_improved": rerank
    }
    
    return answer, source, 1.0 - confidence, metadata
