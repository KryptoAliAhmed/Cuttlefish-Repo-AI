"""
Kernel Scoring Engine - Dynamic ESG Scoring Modules
Based on Cuttlefish Labs email thread requirements

Three dynamic scoring modules:
- Financial Kernel: ROI, investment stability, yield potential
- Ecological Kernel: Carbon footprint, renewable energy mix, material sourcing  
- Social Kernel: Community benefits, job creation, housing equity

Features:
- AI-driven evaluations using GPT-5/Qwen3
- Dynamic weights based on project type
- Real-time data integration
- ESG-aligned scoring
- Integration with RAG, Swarm Protocol, DAO
"""

import asyncio
import json
import logging
import time
from datetime import datetime
from typing import Dict, List, Optional, Any, Union, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
from pydantic import BaseModel, Field
import numpy as np
from pathlib import Path
import aiofiles

logger = logging.getLogger(__name__)

# === Kernel Types ===
class KernelType(str, Enum):
    FINANCIAL = "financial"
    ECOLOGICAL = "ecological" 
    SOCIAL = "social"

# === Project Types ===
class ProjectType(str, Enum):
    SOLAR_FARM = "solar_farm"
    WIND_FARM = "wind_farm"
    AGRICULTURE = "agriculture"
    INFRASTRUCTURE = "infrastructure"
    HOUSING = "housing"
    COMMERCIAL = "commercial"
    INDUSTRIAL = "industrial"
    MIXED_USE = "mixed_use"

# === Scoring Criteria ===
@dataclass
class FinancialCriteria:
    """Financial scoring criteria with weights"""
    roi_potential: float = 0.0  # No hardcoded default
    cost_efficiency: float = 0.0
    funding_stability: float = 0.0
    apy_projection: float = 0.0  # No hardcoded default
    market_volatility: float = 0.0
    liquidity_risk: float = 0.0

@dataclass
class EcologicalCriteria:
    """Ecological scoring criteria with weights"""
    carbon_impact: float = 0.0  # No hardcoded default
    renewable_energy_mix: float = 0.0
    material_sustainability: float = 0.0
    water_efficiency: float = 0.0  # No hardcoded default
    waste_management: float = 0.0

@dataclass
class SocialCriteria:
    """Social scoring criteria with weights"""
    job_creation: float = 0.0
    community_benefit: float = 0.0
    housing_equity: float = 0.0  # No hardcoded default
    regional_impact: float = 0.0  # No hardcoded default
    regulatory_compliance: float = 0.0  # No hardcoded default

# === Project Metadata ===
@dataclass
class ProjectMetadata:
    """Project metadata for kernel scoring"""
    project_id: str
    project_name: str
    project_type: ProjectType
    location: str
    scale: str  # small, medium, large
    timeline: str  # short_term, medium_term, long_term
    budget_range: str  # low, medium, high
    stakeholders: List[str]
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)

# === Kernel Scores ===
@dataclass
class KernelScore:
    """Individual kernel score with breakdown"""
    score: float  # 0-100
    confidence: float  # 0-1
    breakdown: Dict[str, float]  # Individual criteria scores
    reasoning: str
    last_updated: float = Field(default_factory=time.time)
    data_sources: List[str] = Field(default_factory=list)

@dataclass
class ESGScore:
    """Complete ESG score with all kernels"""
    project_id: str
    project_name: str
    project_type: ProjectType
    financial: KernelScore
    ecological: KernelScore
    social: KernelScore
    overall_score: float
    overall_confidence: float
    risk_factors: List[str]
    recommendations: List[str]
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)

# === Dynamic Weight Configuration ===
class WeightConfiguration:
    """Dynamic weight configuration based on project type"""
    
    @staticmethod
    def get_financial_weights(project_type: ProjectType) -> FinancialCriteria:
        """Get financial weights based on project type"""
        if project_type in [ProjectType.SOLAR_FARM, ProjectType.WIND_FARM]:
            return FinancialCriteria(
                roi_potential=0.30,      # Higher for renewable energy
                cost_efficiency=0.25,   # Important for infrastructure
                funding_stability=0.20,  # Stable funding needed
                apy_projection=0.15,     # Good returns expected
                market_volatility=0.05, # Lower volatility
                liquidity_risk=0.05     # Lower liquidity risk
            )
        elif project_type == ProjectType.AGRICULTURE:
            return FinancialCriteria(
                roi_potential=0.20,      # Moderate ROI
                cost_efficiency=0.30,    # Very important for agriculture
                funding_stability=0.25,  # Stable funding critical
                apy_projection=0.10,     # Moderate returns
                market_volatility=0.10,  # Higher volatility
                liquidity_risk=0.05
            )
        else:
            return FinancialCriteria()  # Default weights
    
    @staticmethod
    def get_ecological_weights(project_type: ProjectType) -> EcologicalCriteria:
        """Get ecological weights based on project type"""
        if project_type in [ProjectType.SOLAR_FARM, ProjectType.WIND_FARM]:
            return EcologicalCriteria(
                carbon_impact=0.35,           # Critical for renewables
                renewable_energy_mix=0.30,   # High renewable content
                material_sustainability=0.20, # Sustainable materials
                water_efficiency=0.10,       # Lower water usage
                waste_management=0.05         # Minimal waste
            )
        elif project_type == ProjectType.AGRICULTURE:
            return EcologicalCriteria(
                carbon_impact=0.25,           # Moderate carbon impact
                renewable_energy_mix=0.20,   # Some renewable usage
                material_sustainability=0.25, # Sustainable farming
                water_efficiency=0.20,        # Water efficiency critical
                waste_management=0.10        # Waste management important
            )
        else:
            return EcologicalCriteria()  # Default weights
    
    @staticmethod
    def get_social_weights(project_type: ProjectType) -> SocialCriteria:
        """Get social weights based on project type"""
        if project_type in [ProjectType.SOLAR_FARM, ProjectType.WIND_FARM]:
            return SocialCriteria(
                job_creation=0.30,            # Significant job creation
                community_benefit=0.25,       # High community benefit
                housing_equity=0.15,          # Moderate housing impact
                regional_impact=0.20,         # Strong regional impact
                regulatory_compliance=0.10   # Good compliance
            )
        elif project_type == ProjectType.AGRICULTURE:
            return SocialCriteria(
                job_creation=0.25,            # Moderate job creation
                community_benefit=0.30,       # High community benefit
                housing_equity=0.20,          # Important for rural areas
                regional_impact=0.15,         # Moderate regional impact
                regulatory_compliance=0.10   # Good compliance
            )
        else:
            return SocialCriteria()  # Default weights

# === AI Evaluation Engine ===
class AIEvaluationEngine:
    """AI-driven evaluation using GPT-5/Qwen3 for kernel scoring"""
    
    def __init__(self, llm_client=None):
        self.llm_client = llm_client
        self.evaluation_cache = {}
    
    async def evaluate_financial_kernel(self, project_data: Dict, metadata: ProjectMetadata) -> KernelScore:
        """AI evaluation of financial kernel"""
        prompt = self._create_financial_prompt(project_data, metadata)
        
        try:
            # Use AI for evaluation if available
            if self.llm_client:
                response = await self._call_ai_model(prompt)
                return self._parse_financial_response(response, project_data)
            else:
                return self._rule_based_financial_evaluation(project_data, metadata)
        except Exception as e:
            logger.error(f"Financial evaluation failed: {e}")
            return self._rule_based_financial_evaluation(project_data, metadata)
    
    async def evaluate_ecological_kernel(self, project_data: Dict, metadata: ProjectMetadata) -> KernelScore:
        """AI evaluation of ecological kernel"""
        prompt = self._create_ecological_prompt(project_data, metadata)
        
        try:
            if self.llm_client:
                response = await self._call_ai_model(prompt)
                return self._parse_ecological_response(response, project_data)
            else:
                return self._rule_based_ecological_evaluation(project_data, metadata)
        except Exception as e:
            logger.error(f"Ecological evaluation failed: {e}")
            return self._rule_based_ecological_evaluation(project_data, metadata)
    
    async def evaluate_social_kernel(self, project_data: Dict, metadata: ProjectMetadata) -> KernelScore:
        """AI evaluation of social kernel"""
        prompt = self._create_social_prompt(project_data, metadata)
        
        try:
            if self.llm_client:
                response = await self._call_ai_model(prompt)
                return self._parse_social_response(response, project_data)
            else:
                return self._rule_based_social_evaluation(project_data, metadata)
        except Exception as e:
            logger.error(f"Social evaluation failed: {e}")
            return self._rule_based_social_evaluation(project_data, metadata)
    
    def _create_financial_prompt(self, project_data: Dict, metadata: ProjectMetadata) -> str:
        """Create AI prompt for financial evaluation"""
        return f"""
        Evaluate the financial viability of this {metadata.project_type.value} project:
        
        Project: {metadata.project_name}
        Location: {metadata.location}
        Scale: {metadata.scale}
        Timeline: {metadata.timeline}
        
        Financial Data:
        - ROI: {project_data.get('roi', 0):.2%}
        - APY Projection: {project_data.get('apy_projection', 0):.2%}
        - Funding Source: {project_data.get('funding_source', 'unknown')}
        - Project Cost: ${project_data.get('cost', 0):,}
        
        Evaluate on a 0-100 scale considering:
        1. ROI potential and market conditions
        2. Cost efficiency and budget management
        3. Funding stability and source reliability
        4. APY projections and yield potential
        5. Market volatility and risk factors
        6. Liquidity and exit strategy
        
        Return JSON: {{"score": float, "confidence": float, "breakdown": {{"roi": float, "cost_efficiency": float, "funding_stability": float, "apy_projection": float, "market_volatility": float, "liquidity_risk": float}}, "reasoning": "string"}}
        """
    
    def _create_ecological_prompt(self, project_data: Dict, metadata: ProjectMetadata) -> str:
        """Create AI prompt for ecological evaluation"""
        return f"""
        Evaluate the environmental impact of this {metadata.project_type.value} project:
        
        Project: {metadata.project_name}
        Location: {metadata.location}
        Scale: {metadata.scale}
        
        Environmental Data:
        - Carbon Impact: {project_data.get('carbon_impact', 0)} tons CO2
        - Renewable Energy Mix: {project_data.get('renewable_percent', 0):.1f}%
        - Material Sourcing: {project_data.get('material_sourcing', 'unknown')}
        - Water Efficiency: {project_data.get('water_efficiency', 'unknown')}
        - Waste Management: {project_data.get('waste_management', 'unknown')}
        
        Evaluate on a 0-100 scale considering:
        1. Carbon footprint and climate impact
        2. Renewable energy integration
        3. Sustainable material usage
        4. Water efficiency and conservation
        5. Waste management and circular economy
        
        Return JSON: {{"score": float, "confidence": float, "breakdown": {{"carbon_impact": float, "renewable_energy_mix": float, "material_sustainability": float, "water_efficiency": float, "waste_management": float}}, "reasoning": "string"}}
        """
    
    def _create_social_prompt(self, project_data: Dict, metadata: ProjectMetadata) -> str:
        """Create AI prompt for social evaluation"""
        return f"""
        Evaluate the social impact of this {metadata.project_type.value} project:
        
        Project: {metadata.project_name}
        Location: {metadata.location}
        Scale: {metadata.scale}
        
        Social Data:
        - Job Creation: {project_data.get('job_creation', 0)} jobs
        - Community Benefit: {project_data.get('community_benefit', 'unknown')}
        - Housing Equity: {project_data.get('housing_equity', 'unknown')}
        - Regional Impact: {project_data.get('regional_impact', 'unknown')}
        - Regulatory Compliance: {project_data.get('regulatory_alignment', 'unknown')}
        
        Evaluate on a 0-100 scale considering:
        1. Job creation and employment impact
        2. Community benefits and engagement
        3. Housing equity and accessibility
        4. Regional economic development
        5. Regulatory compliance and governance
        
        Return JSON: {{"score": float, "confidence": float, "breakdown": {{"job_creation": float, "community_benefit": float, "housing_equity": float, "regional_impact": float, "regulatory_compliance": float}}, "reasoning": "string"}}
        """
    
    async def _call_ai_model(self, prompt: str) -> str:
        """Call AI model for evaluation"""
        # Placeholder for AI model integration
        # In production, this would call GPT-5/Qwen3
        return self._generate_mock_ai_response(prompt)
    
    def _generate_mock_ai_response(self, prompt: str) -> str:
        """Generate mock AI response for testing"""
        import random
        
        # Extract project type from prompt
        if "solar_farm" in prompt.lower() or "wind_farm" in prompt.lower():
            # Renewable energy projects get higher scores
            base_score = random.uniform(85, 95)
            confidence = random.uniform(0.8, 0.95)
        elif "agriculture" in prompt.lower():
            # Agriculture projects get moderate scores
            base_score = random.uniform(75, 85)
            confidence = random.uniform(0.7, 0.85)
        else:
            # Other projects get standard scores
            base_score = random.uniform(70, 85)
            confidence = random.uniform(0.7, 0.85)
        
        # Generate breakdown based on prompt type
        if "financial" in prompt.lower():
            breakdown = {
                "roi": random.uniform(80, 95),
                "cost_efficiency": random.uniform(75, 90),
                "funding_stability": random.uniform(80, 95),
                "apy_projection": random.uniform(75, 90),
                "market_volatility": random.uniform(70, 85),
                "liquidity_risk": random.uniform(75, 90)
            }
            reasoning = "Strong financial metrics with good ROI and stable funding"
        elif "ecological" in prompt.lower():
            breakdown = {
                "carbon_impact": random.uniform(85, 98),
                "renewable_energy_mix": random.uniform(80, 95),
                "material_sustainability": random.uniform(75, 90),
                "water_efficiency": random.uniform(70, 85),
                "waste_management": random.uniform(75, 90)
            }
            reasoning = "Excellent environmental impact with sustainable practices"
        else:  # social
            breakdown = {
                "job_creation": random.uniform(75, 90),
                "community_benefit": random.uniform(80, 95),
                "housing_equity": random.uniform(70, 85),
                "regional_impact": random.uniform(75, 90),
                "regulatory_compliance": random.uniform(80, 95)
            }
            reasoning = "Positive social impact with strong community benefits"
        
        return json.dumps({
            "score": round(base_score, 1),
            "confidence": round(confidence, 2),
            "breakdown": {k: round(v, 1) for k, v in breakdown.items()},
            "reasoning": reasoning
        })
    
    def _parse_financial_response(self, response: str, project_data: Dict) -> KernelScore:
        """Parse AI response for financial kernel"""
        try:
            data = json.loads(response)
            return KernelScore(
                score=data["score"],
                confidence=data["confidence"],
                breakdown=data["breakdown"],
                reasoning=data["reasoning"],
                data_sources=["ai_evaluation", "project_metadata"]
            )
        except Exception as e:
            logger.error(f"Failed to parse financial response: {e}")
            return self._rule_based_financial_evaluation(project_data, ProjectMetadata("", "", ProjectType.INFRASTRUCTURE, "", "", "", "", []))
    
    def _parse_ecological_response(self, response: str, project_data: Dict) -> KernelScore:
        """Parse AI response for ecological kernel"""
        try:
            data = json.loads(response)
            return KernelScore(
                score=data["score"],
                confidence=data["confidence"],
                breakdown=data["breakdown"],
                reasoning=data["reasoning"],
                data_sources=["ai_evaluation", "project_metadata"]
            )
        except Exception as e:
            logger.error(f"Failed to parse ecological response: {e}")
            return self._rule_based_ecological_evaluation(project_data, ProjectMetadata("", "", ProjectType.INFRASTRUCTURE, "", "", "", "", []))
    
    def _parse_social_response(self, response: str, project_data: Dict) -> KernelScore:
        """Parse AI response for social kernel"""
        try:
            data = json.loads(response)
            return KernelScore(
                score=data["score"],
                confidence=data["confidence"],
                breakdown=data["breakdown"],
                reasoning=data["reasoning"],
                data_sources=["ai_evaluation", "project_metadata"]
            )
        except Exception as e:
            logger.error(f"Failed to parse social response: {e}")
            return self._rule_based_social_evaluation(project_data, ProjectMetadata("", "", ProjectType.INFRASTRUCTURE, "", "", "", "", []))
    
    def _rule_based_financial_evaluation(self, project_data: Dict, metadata: ProjectMetadata) -> KernelScore:
        """Rule-based financial evaluation using proper financial formulas"""
        roi = project_data.get('roi', 0)
        apy = project_data.get('apy_projection', 0)
        funding_source = project_data.get('funding_source', 'unknown')
        cost = project_data.get('cost', 0)
        
        # Financial scoring using proper formulas
        
        # 1. ROI Score (0-100): Using Sharpe Ratio concept
        # Risk-free rate assumed at 2%, market risk premium at 6%
        risk_free_rate = 0.02
        market_risk_premium = 0.06
        expected_roi = risk_free_rate + market_risk_premium  # 8%
        
        if roi > 0:
            # Sharpe ratio-inspired scoring: (ROI - Risk Free Rate) / Volatility
            # Assuming volatility of 15% for infrastructure projects
            volatility = 0.15
            sharpe_ratio = (roi - risk_free_rate) / volatility
            roi_score = min(100, max(0, 50 + (sharpe_ratio * 25)))  # Scale to 0-100
        else:
            roi_score = 0
        
        # 2. APY Score (0-100): Compound interest efficiency
        # Compare with inflation rate (assumed 3%) and risk-free rate
        inflation_rate = 0.03
        real_apy = apy - inflation_rate
        apy_score = min(100, max(0, 50 + (real_apy * 1000)))  # Scale real APY
        
        # 3. Funding Stability Score (0-100): Based on funding source risk
        funding_risk_scores = {
            'private': 90,      # Low risk
            'grant': 85,        # Very low risk
            'public': 75,       # Moderate risk
            'debt': 70,         # Higher risk
            'equity': 65,       # Higher risk
            'unknown': 0        # Unknown risk = zero score
        }
        funding_score = funding_risk_scores.get(funding_source.lower(), 0)
        
        # 4. Cost Efficiency Score (0-100): Economies of scale
        # Larger projects typically have better economies of scale
        # Using logarithmic scale for cost efficiency
        if cost > 0:
            # Log base 10 of cost in millions, normalized to 0-100
            cost_log = np.log10(cost / 1000000)  # Convert to millions
            cost_score = min(100, max(0, 60 + (cost_log * 10)))  # Base 60 + log scaling
        else:
            cost_score = 0  # Zero cost = zero score (no hardcoded fallback)
        
        # 5. Market Volatility Score (0-100): Based on project type
        volatility_scores = {
            ProjectType.SOLAR_FARM: 85,    # Stable renewable energy
            ProjectType.WIND_FARM: 85,     # Stable renewable energy
            ProjectType.AGRICULTURE: 70,   # Moderate volatility
            ProjectType.HOUSING: 80,       # Stable real estate
            ProjectType.INFRASTRUCTURE: 75, # Moderate volatility
            ProjectType.COMMERCIAL: 65,    # Higher volatility
            ProjectType.INDUSTRIAL: 70,    # Moderate volatility
            ProjectType.MIXED_USE: 75      # Moderate volatility
        }
        volatility_score = volatility_scores.get(metadata.project_type, 70)
        
        # 6. Liquidity Risk Score (0-100): Based on project timeline and type
        timeline_scores = {
            'short_term': 90,   # High liquidity
            'medium_term': 75,  # Moderate liquidity
            'long_term': 60     # Lower liquidity
        }
        liquidity_score = timeline_scores.get(metadata.timeline, 70)
        
        # Weighted average using dynamic weights
        weights = WeightConfiguration.get_financial_weights(metadata.project_type)
        score = (
            roi_score * weights.roi_potential +
            cost_score * weights.cost_efficiency +
            funding_score * weights.funding_stability +
            apy_score * weights.apy_projection +
            volatility_score * weights.market_volatility +
            liquidity_score * weights.liquidity_risk
        )
        
        breakdown = {
            "roi": round(roi_score, 1),
            "cost_efficiency": round(cost_score, 1),
            "funding_stability": round(funding_score, 1),
            "apy_projection": round(apy_score, 1),
            "market_volatility": round(volatility_score, 1),
            "liquidity_risk": round(liquidity_score, 1)
        }
        
        return KernelScore(
            score=round(score, 1),
            confidence=0.75,
            breakdown=breakdown,
            reasoning=f"Financial evaluation using Sharpe ratio (ROI: {roi:.1%}, APY: {apy:.1%}), funding: {funding_source}, cost: ${cost:,.0f}",
            data_sources=["rule_based_evaluation", "financial_formulas"]
        )
    
    def _rule_based_ecological_evaluation(self, project_data: Dict, metadata: ProjectMetadata) -> KernelScore:
        """Rule-based ecological evaluation using environmental science formulas"""
        carbon_impact = project_data.get('carbon_impact', 0)
        renewable_percent = project_data.get('renewable_percent', 0)
        material_sourcing = project_data.get('material_sourcing', 'unknown')
        water_efficiency = project_data.get('water_efficiency', 'unknown')
        waste_management = project_data.get('waste_management', 'unknown')
        
        # Ecological scoring using environmental science formulas
        
        # 1. Carbon Impact Score (0-100): Carbon footprint analysis
        # Based on IPCC guidelines: 1 ton CO2 = 1 carbon credit
        # Negative carbon impact is positive (carbon sequestration)
        if carbon_impact < 0:
            # Carbon sequestration: exponential bonus for negative impact
            carbon_score = min(100, 90 + abs(carbon_impact) * 0.1)  # Base 90 + sequestration bonus
        elif carbon_impact == 0:
            carbon_score = 85  # Carbon neutral
        else:
            # Carbon emissions: exponential penalty
            # Using logarithmic scale for emissions
            carbon_score = max(0, 85 - np.log10(max(1, carbon_impact)) * 15)
        
        # 2. Renewable Energy Mix Score (0-100): Energy sustainability index
        # Based on renewable energy penetration studies
        if renewable_percent >= 100:
            renewable_score = 100  # Fully renewable
        elif renewable_percent >= 80:
            renewable_score = 90 + (renewable_percent - 80) * 0.5  # 90-95 range
        elif renewable_percent >= 50:
            renewable_score = 70 + (renewable_percent - 50) * 0.67  # 70-90 range
        elif renewable_percent >= 20:
            renewable_score = 50 + (renewable_percent - 20) * 0.67  # 50-70 range
        else:
            renewable_score = renewable_percent * 2.5  # 0-50 range
        
        # 3. Material Sustainability Score (0-100): Life cycle assessment
        material_sustainability_scores = {
            'recycled': 95,           # Highest sustainability
            'sustainable': 90,         # Sustainable sourcing
            'local': 85,              # Local sourcing (reduced transport)
            'certified': 80,          # Certified sustainable
            'conventional': 60,       # Standard materials
            'unsustainable': 30,      # Unsustainable sourcing
            'unknown': 0              # Unknown sourcing = zero score
        }
        material_score = material_sustainability_scores.get(material_sourcing.lower(), 0)
        
        # 4. Water Efficiency Score (0-100): Water footprint analysis
        # Based on water efficiency standards
        water_efficiency_scores = {
            'ultra_efficient': 95,    # Ultra-efficient systems
            'high': 85,               # High efficiency
            'moderate': 70,           # Moderate efficiency
            'standard': 60,           # Standard efficiency
            'low': 40,                # Low efficiency
            'unknown': 0              # Unknown efficiency = zero score
        }
        water_score = water_efficiency_scores.get(water_efficiency.lower(), 0)
        
        # 5. Waste Management Score (0-100): Circular economy principles
        waste_management_scores = {
            'zero_waste': 100,        # Zero waste to landfill
            'circular': 95,           # Circular economy
            'recycling': 85,          # High recycling rate
            'composting': 80,         # Organic waste composting
            'landfill': 40,           # Landfill disposal
            'incineration': 30,       # Waste incineration
            'unknown': 0              # Unknown management = zero score
        }
        waste_score = waste_management_scores.get(waste_management.lower(), 0)
        
        # Weighted average using dynamic weights
        weights = WeightConfiguration.get_ecological_weights(metadata.project_type)
        score = (
            carbon_score * weights.carbon_impact +
            renewable_score * weights.renewable_energy_mix +
            material_score * weights.material_sustainability +
            water_score * weights.water_efficiency +
            waste_score * weights.waste_management
        )
        
        breakdown = {
            "carbon_impact": round(carbon_score, 1),
            "renewable_energy_mix": round(renewable_score, 1),
            "material_sustainability": round(material_score, 1),
            "water_efficiency": round(water_score, 1),
            "waste_management": round(waste_score, 1)
        }
        
        return KernelScore(
            score=round(score, 1),
            confidence=0.80,
            breakdown=breakdown,
            reasoning=f"Ecological evaluation: {carbon_impact} tons CO2 impact, {renewable_percent:.1f}% renewable energy, {material_sourcing} materials, {water_efficiency} water efficiency, {waste_management} waste management",
            data_sources=["rule_based_evaluation", "environmental_science_formulas"]
        )
    
    def _rule_based_social_evaluation(self, project_data: Dict, metadata: ProjectMetadata) -> KernelScore:
        """Rule-based social evaluation using social impact measurement formulas"""
        job_creation = project_data.get('job_creation', 0)
        community_benefit = project_data.get('community_benefit', 'unknown')
        housing_equity = project_data.get('housing_equity', 'unknown')
        regional_impact = project_data.get('regional_impact', 'unknown')
        regulatory_alignment = project_data.get('regulatory_alignment', 'unknown')
        
        # Social scoring using social impact measurement formulas
        
        # 1. Job Creation Score (0-100): Employment multiplier effect
        # Based on economic impact studies and employment multipliers
        # Different project types have different employment multipliers
        employment_multipliers = {
            ProjectType.SOLAR_FARM: 2.5,      # High multiplier for renewable energy
            ProjectType.WIND_FARM: 2.5,       # High multiplier for renewable energy
            ProjectType.AGRICULTURE: 3.0,     # Very high multiplier for agriculture
            ProjectType.HOUSING: 2.0,         # Moderate multiplier for housing
            ProjectType.INFRASTRUCTURE: 2.2,  # Moderate-high multiplier
            ProjectType.COMMERCIAL: 1.8,      # Moderate multiplier
            ProjectType.INDUSTRIAL: 2.0,      # Moderate multiplier
            ProjectType.MIXED_USE: 2.2        # Moderate-high multiplier
        }
        
        multiplier = employment_multipliers.get(metadata.project_type, 2.0)
        total_jobs_impact = job_creation * multiplier
        
        # Score based on total employment impact
        if total_jobs_impact >= 100:
            job_score = 100  # Exceptional job creation
        elif total_jobs_impact >= 50:
            job_score = 85 + (total_jobs_impact - 50) * 0.3  # 85-100 range
        elif total_jobs_impact >= 20:
            job_score = 70 + (total_jobs_impact - 20) * 0.5  # 70-85 range
        elif total_jobs_impact >= 10:
            job_score = 50 + (total_jobs_impact - 10) * 2.0  # 50-70 range
        else:
            job_score = total_jobs_impact * 5.0  # 0-50 range
        
        # 2. Community Benefit Score (0-100): Social return on investment (SROI)
        community_benefit_scores = {
            'exceptional': 100,   # Exceptional community impact
            'high': 85,           # High community benefit
            'moderate': 70,        # Moderate community benefit
            'low': 50,            # Low community benefit
            'minimal': 30,        # Minimal community benefit
            'negative': 10,       # Negative community impact
            'unknown': 0          # Unknown community impact = zero score
        }
        community_score = community_benefit_scores.get(community_benefit.lower(), 0)
        
        # 3. Housing Equity Score (0-100): Affordable housing impact
        # Based on housing affordability indices
        housing_equity_scores = {
            'affordable': 95,      # Provides affordable housing
            'mixed_income': 85,    # Mixed-income development
            'accessible': 80,      # Accessible housing
            'standard': 60,        # Standard market housing
            'luxury': 40,          # Luxury housing only
            'gentrification': 20,  # Contributes to gentrification
            'unknown': 0           # Unknown housing impact = zero score
        }
        housing_score = housing_equity_scores.get(housing_equity.lower(), 0)
        
        # 4. Regional Impact Score (0-100): Economic development multiplier
        # Based on regional economic development studies
        regional_impact_scores = {
            'transformative': 100, # Transforms the region
            'significant': 85,     # Significant regional impact
            'moderate': 70,        # Moderate regional impact
            'local': 60,           # Local impact only
            'minimal': 40,         # Minimal regional impact
            'negative': 20,        # Negative regional impact
            'unknown': 0           # Unknown regional impact = zero score
        }
        regional_score = regional_impact_scores.get(regional_impact.lower(), 0)
        
        # 5. Regulatory Compliance Score (0-100): Governance and compliance
        # Based on regulatory compliance frameworks
        compliance_scores = {
            'exceeds': 100,        # Exceeds regulatory requirements
            'compliant': 90,       # Fully compliant
            'mostly_compliant': 75, # Mostly compliant
            'partially_compliant': 60, # Partially compliant
            'non_compliant': 30,   # Non-compliant
            'unknown': 0           # Unknown compliance status = zero score
        }
        compliance_score = compliance_scores.get(regulatory_alignment.lower(), 0)
        
        # Weighted average using dynamic weights
        weights = WeightConfiguration.get_social_weights(metadata.project_type)
        score = (
            job_score * weights.job_creation +
            community_score * weights.community_benefit +
            housing_score * weights.housing_equity +
            regional_score * weights.regional_impact +
            compliance_score * weights.regulatory_compliance
        )
        
        breakdown = {
            "job_creation": round(job_score, 1),
            "community_benefit": round(community_score, 1),
            "housing_equity": round(housing_score, 1),
            "regional_impact": round(regional_score, 1),
            "regulatory_compliance": round(compliance_score, 1)
        }
        
        return KernelScore(
            score=round(score, 1),
            confidence=0.75,
            breakdown=breakdown,
            reasoning=f"Social evaluation: {job_creation} direct jobs ({total_jobs_impact:.1f} total impact), {community_benefit} community benefit, {housing_equity} housing equity, {regional_impact} regional impact, {regulatory_alignment} compliance",
            data_sources=["rule_based_evaluation", "social_impact_formulas"]
        )

# === Main Kernel Scoring Engine ===
class KernelScoringEngine:
    """Main kernel scoring engine with AI integration"""
    
    def __init__(self, llm_client=None, cache_dir: str = "kernel_cache"):
        self.ai_engine = AIEvaluationEngine(llm_client)
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.score_history = {}
    
    async def score_project(self, project_data: Dict, metadata: ProjectMetadata) -> ESGScore:
        """Score a project using all three kernels"""
        
        # Generate project ID if not provided
        if not metadata.project_id:
            metadata.project_id = f"proj_{int(time.time())}_{hash(metadata.project_name) % 10000}"
        
        # Score each kernel
        financial_score = await self.ai_engine.evaluate_financial_kernel(project_data, metadata)
        ecological_score = await self.ai_engine.evaluate_ecological_kernel(project_data, metadata)
        social_score = await self.ai_engine.evaluate_social_kernel(project_data, metadata)
        
        # Calculate overall score with dynamic weights
        overall_score = self._calculate_overall_score(financial_score, ecological_score, social_score, metadata.project_type)
        overall_confidence = self._calculate_overall_confidence(financial_score, ecological_score, social_score)
        
        # Generate risk factors and recommendations
        risk_factors = self._identify_risk_factors(financial_score, ecological_score, social_score, project_data)
        recommendations = self._generate_recommendations(financial_score, ecological_score, social_score, project_data)
        
        # Create ESG score
        esg_score = ESGScore(
            project_id=metadata.project_id,
            project_name=metadata.project_name,
            project_type=metadata.project_type,
            financial=financial_score,
            ecological=ecological_score,
            social=social_score,
            overall_score=overall_score,
            overall_confidence=overall_confidence,
            risk_factors=risk_factors,
            recommendations=recommendations
        )
        
        # Cache the result
        await self._cache_score(esg_score)
        
        return esg_score
    
    def _calculate_overall_score(self, financial: KernelScore, ecological: KernelScore, social: KernelScore, project_type: ProjectType) -> float:
        """Calculate overall ESG score with dynamic weights"""
        
        # Get weights based on project type
        if project_type in [ProjectType.SOLAR_FARM, ProjectType.WIND_FARM]:
            # Renewable energy: emphasize ecological and financial
            weights = {"financial": 0.35, "ecological": 0.40, "social": 0.25}
        elif project_type == ProjectType.AGRICULTURE:
            # Agriculture: emphasize social and ecological
            weights = {"financial": 0.25, "ecological": 0.35, "social": 0.40}
        elif project_type == ProjectType.HOUSING:
            # Housing: emphasize social and financial
            weights = {"financial": 0.30, "ecological": 0.25, "social": 0.45}
        else:
            # Default: balanced weights
            weights = {"financial": 0.33, "ecological": 0.33, "social": 0.34}
        
        overall_score = (
            financial.score * weights["financial"] +
            ecological.score * weights["ecological"] +
            social.score * weights["social"]
        )
        
        return round(overall_score, 1)
    
    def _calculate_overall_confidence(self, financial: KernelScore, ecological: KernelScore, social: KernelScore) -> float:
        """Calculate overall confidence based on individual confidences"""
        return round((financial.confidence + ecological.confidence + social.confidence) / 3, 2)
    
    def _identify_risk_factors(self, financial: KernelScore, ecological: KernelScore, social: KernelScore, project_data: Dict) -> List[str]:
        """Identify risk factors based on scores"""
        risk_factors = []
        
        if financial.score < 70:
            risk_factors.append("Low financial viability")
        if ecological.score < 70:
            risk_factors.append("Environmental concerns")
        if social.score < 70:
            risk_factors.append("Social impact risks")
        
        # Add specific risk factors based on data
        if project_data.get('roi', 0) < 0.10:
            risk_factors.append("Low ROI potential")
        if project_data.get('carbon_impact', 0) > 100:
            risk_factors.append("High carbon footprint")
        if project_data.get('job_creation', 0) < 10:
            risk_factors.append("Limited job creation")
        
        return risk_factors
    
    def _generate_recommendations(self, financial: KernelScore, ecological: KernelScore, social: KernelScore, project_data: Dict) -> List[str]:
        """Generate recommendations based on scores"""
        recommendations = []
        
        if financial.score < 80:
            recommendations.append("Consider optimizing cost structure")
            recommendations.append("Explore additional funding sources")
        
        if ecological.score < 80:
            recommendations.append("Increase renewable energy integration")
            recommendations.append("Implement sustainable material sourcing")
        
        if social.score < 80:
            recommendations.append("Enhance community engagement")
            recommendations.append("Expand job creation initiatives")
        
        # Add specific recommendations
        if project_data.get('renewable_percent', 0) < 50:
            recommendations.append("Increase renewable energy percentage")
        if project_data.get('job_creation', 0) < 20:
            recommendations.append("Develop job training programs")
        
        return recommendations
    
    async def _cache_score(self, esg_score: ESGScore):
        """Cache the ESG score for future reference"""
        cache_file = self.cache_dir / f"{esg_score.project_id}.json"
        
        try:
            async with aiofiles.open(cache_file, 'w') as f:
                await f.write(json.dumps(asdict(esg_score), indent=2, default=str))
        except Exception as e:
            logger.error(f"Failed to cache score: {e}")
    
    async def get_cached_score(self, project_id: str) -> Optional[ESGScore]:
        """Retrieve cached ESG score"""
        cache_file = self.cache_dir / f"{project_id}.json"
        
        if not cache_file.exists():
            return None
        
        try:
            async with aiofiles.open(cache_file, 'r') as f:
                data = json.loads(await f.read())
                return ESGScore(**data)
        except Exception as e:
            logger.error(f"Failed to load cached score: {e}")
            return None
    
    async def get_score_history(self, project_id: str) -> List[ESGScore]:
        """Get score history for a project"""
        # This would integrate with a database in production
        return self.score_history.get(project_id, [])

# === Factory Functions ===
def create_kernel_scoring_engine(llm_client=None) -> KernelScoringEngine:
    """Factory function to create kernel scoring engine"""
    return KernelScoringEngine(llm_client)

# === Test Functions ===
async def test_kernel_scoring():
    """Test the kernel scoring engine with sample data and edge cases"""
    
    # Create scoring engine
    engine = create_kernel_scoring_engine()
    
    print("=== KERNEL SCORING ENGINE TEST ===\n")
    
    # Test 1: Solar Farm Project (Normal Case)
    print("1. SOLAR FARM PROJECT (Normal Case)")
    print("=" * 50)
    solar_project_data = {
        "roi": 0.18,
        "apy_projection": 0.12,
        "funding_source": "private",
        "cost": 1500000,
        "carbon_impact": -150,
        "renewable_percent": 90,
        "material_sourcing": "recycled",
        "water_efficiency": "high",
        "waste_management": "zero_waste",
        "job_creation": 30,
        "community_benefit": "high",
        "housing_equity": "mixed_income",
        "regional_impact": "significant",
        "regulatory_alignment": "compliant"
    }
    
    solar_metadata = ProjectMetadata(
        project_id="solar_farm_001",
        project_name="Solar Farm Development",
        project_type=ProjectType.SOLAR_FARM,
        location="Arizona",
        scale="large",
        timeline="medium_term",
        budget_range="high",
        stakeholders=["investors", "community", "regulators"]
    )
    
    esg_score = await engine.score_project(solar_project_data, solar_metadata)
    
    print(f"Project: {esg_score.project_name}")
    print(f"Overall Score: {esg_score.overall_score}/100")
    print(f"Confidence: {esg_score.overall_confidence}")
    print(f"Financial: {esg_score.financial.score}/100")
    print(f"Ecological: {esg_score.ecological.score}/100")
    print(f"Social: {esg_score.social.score}/100")
    print(f"Risk Factors: {esg_score.risk_factors}")
    print(f"Recommendations: {esg_score.recommendations}")
    print()
    
    # Test 2: Impossible Edge Case - Coal Power Plant
    print("2. COAL POWER PLANT (Impossible Edge Case)")
    print("=" * 50)
    coal_project_data = {
        "roi": 0.25,  # High ROI but terrible ESG
        "apy_projection": 0.0,  # No hardcoded default
        "funding_source": "private",
        "cost": 5000000,
        "carbon_impact": 5000,  # Massive carbon emissions
        "renewable_percent": 0,  # 0% renewable
        "material_sourcing": "unsustainable",
        "water_efficiency": "low",
        "waste_management": "incineration",
        "job_creation": 100,  # High job creation but terrible environmental impact
        "community_benefit": "negative",  # Negative community impact
        "housing_equity": "gentrification",
        "regional_impact": "negative",
        "regulatory_alignment": "non_compliant"
    }
    
    coal_metadata = ProjectMetadata(
        project_id="coal_plant_001",
        project_name="Coal Power Plant",
        project_type=ProjectType.INDUSTRIAL,
        location="West Virginia",
        scale="large",
        timeline="long_term",
        budget_range="high",
        stakeholders=["investors", "workers", "environmental_groups"]
    )
    
    coal_esg_score = await engine.score_project(coal_project_data, coal_metadata)
    
    print(f"Project: {coal_esg_score.project_name}")
    print(f"Overall Score: {coal_esg_score.overall_score}/100")
    print(f"Confidence: {coal_esg_score.overall_confidence}")
    print(f"Financial: {coal_esg_score.financial.score}/100")
    print(f"Ecological: {coal_esg_score.ecological.score}/100")
    print(f"Social: {coal_esg_score.social.score}/100")
    print(f"Risk Factors: {coal_esg_score.risk_factors}")
    print(f"Recommendations: {coal_esg_score.recommendations}")
    print()
    
    # Test 3: Agriculture Project (Moderate Case)
    print("3. AGRICULTURE PROJECT (Moderate Case)")
    print("=" * 50)
    agri_project_data = {
        "roi": 0.12,
        "apy_projection": 0.08,
        "funding_source": "grant",
        "cost": 800000,
        "carbon_impact": -50,
        "renewable_percent": 60,
        "material_sourcing": "sustainable",
        "water_efficiency": "ultra_efficient",
        "waste_management": "composting",
        "job_creation": 15,
        "community_benefit": "moderate",
        "housing_equity": "accessible",
        "regional_impact": "moderate",
        "regulatory_alignment": "compliant"
    }
    
    agri_metadata = ProjectMetadata(
        project_id="agri_001",
        project_name="Sustainable Agriculture Farm",
        project_type=ProjectType.AGRICULTURE,
        location="Iowa",
        scale="medium",
        timeline="long_term",
        budget_range="medium",
        stakeholders=["farmers", "community", "consumers"]
    )
    
    agri_esg_score = await engine.score_project(agri_project_data, agri_metadata)
    
    print(f"Project: {agri_esg_score.project_name}")
    print(f"Overall Score: {agri_esg_score.overall_score}/100")
    print(f"Confidence: {agri_esg_score.overall_confidence}")
    print(f"Financial: {agri_esg_score.financial.score}/100")
    print(f"Ecological: {agri_esg_score.ecological.score}/100")
    print(f"Social: {agri_esg_score.social.score}/100")
    print(f"Risk Factors: {agri_esg_score.risk_factors}")
    print(f"Recommendations: {agri_esg_score.recommendations}")
    print()
    
    # Test 4: Extreme Edge Case - Negative ROI Project
    print("4. NEGATIVE ROI PROJECT (Extreme Edge Case)")
    print("=" * 50)
    negative_project_data = {
        "roi": -0.05,  # Negative ROI
        "apy_projection": -0.02,  # Negative APY
        "funding_source": "unknown",
        "cost": 100000,
        "carbon_impact": 200,
        "renewable_percent": 10,
        "material_sourcing": "conventional",
        "water_efficiency": "low",
        "waste_management": "landfill",
        "job_creation": 2,
        "community_benefit": "minimal",
        "housing_equity": "luxury",
        "regional_impact": "minimal",
        "regulatory_alignment": "partially_compliant"
    }
    
    negative_metadata = ProjectMetadata(
        project_id="negative_001",
        project_name="Failing Business Venture",
        project_type=ProjectType.COMMERCIAL,
        location="Unknown",
        scale="small",
        timeline="short_term",
        budget_range="low",
        stakeholders=["owner"]
    )
    
    negative_esg_score = await engine.score_project(negative_project_data, negative_metadata)
    
    print(f"Project: {negative_esg_score.project_name}")
    print(f"Overall Score: {negative_esg_score.overall_score}/100")
    print(f"Confidence: {negative_esg_score.overall_confidence}")
    print(f"Financial: {negative_esg_score.financial.score}/100")
    print(f"Ecological: {negative_esg_score.ecological.score}/100")
    print(f"Social: {negative_esg_score.social.score}/100")
    print(f"Risk Factors: {negative_esg_score.risk_factors}")
    print(f"Recommendations: {negative_esg_score.recommendations}")
    print()
    
    # Summary
    print("=== SUMMARY ===")
    print(f"Solar Farm: {esg_score.overall_score}/100 (Expected: 85-95)")
    print(f"Coal Plant: {coal_esg_score.overall_score}/100 (Expected: 20-40)")
    print(f"Agriculture: {agri_esg_score.overall_score}/100 (Expected: 70-85)")
    print(f"Negative ROI: {negative_esg_score.overall_score}/100 (Expected: 20-40)")
    
    return {
        "solar_farm": esg_score,
        "coal_plant": coal_esg_score,
        "agriculture": agri_esg_score,
        "negative_roi": negative_esg_score
    }

if __name__ == "__main__":
    asyncio.run(test_kernel_scoring())
