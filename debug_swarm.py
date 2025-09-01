#!/usr/bin/env python3
"""
Debug script for Swarm Protocol to identify agent registration issues
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from swarm_protocol import SwarmProtocolManager, AgentType, WorkflowType

async def debug_swarm_protocol():
    """Debug the Swarm Protocol implementation"""
    print("🐙 Debugging Swarm Protocol Implementation")
    print("=" * 50)
    
    # Initialize Swarm Protocol Manager
    swarm_manager = SwarmProtocolManager()
    await swarm_manager.initialize_agents()
    
    print(f"✅ Initialized {len(swarm_manager.protocol.agents)} agents")
    
    # Debug: List all registered agents
    print("\n📋 Registered Agents:")
    print("-" * 30)
    for agent_id, agent in swarm_manager.protocol.agents.items():
        print(f"  ID: {agent_id}")
        print(f"  Type: {agent.agent_type}")
        print(f"  Class: {agent.__class__.__name__}")
        print()
    
    # Debug: Test agent lookup for each type
    print("🔍 Testing Agent Lookup:")
    print("-" * 30)
    all_agent_types = [
        AgentType.PREDICTIVE_AGENT,
        AgentType.BUILDER_AGENT,
        AgentType.SIGNAL_AGENT,
        AgentType.COMPLIANCE_AGENT,
        AgentType.PERMIT_AGENT,
        AgentType.REFACTOR_AGENT,
        AgentType.META_AUDITOR
    ]
    
    for agent_type in all_agent_types:
        agent = swarm_manager.protocol._get_agent_by_type(agent_type)
        status = "✅ Found" if agent else "❌ Not Found"
        print(f"  {agent_type.value}: {status}")
        if agent:
            print(f"    ID: {agent.agent_id}")
            print(f"    Class: {agent.__class__.__name__}")
    
    # Test a parallel workflow with all agents
    print("\n🧪 Testing Parallel Workflow with All Agents:")
    print("-" * 50)
    
    parallel_task = await swarm_manager.create_workflow(
        title="Full Agent Test",
        description="Test all agents in parallel",
        workflow_type=WorkflowType.PARALLEL,
        agents=all_agent_types,
        context={
            "proposal": "solar_farm_optimization",
            "budget": 1000000,
            "market_data": {"asset": "E2R", "timeframe": "1d"},
            "compliance_data": {"type": "trading_operations"},
            "code_data": {"target": "smart_contracts"},
            "forecast_data": {"timeframe": "30d"}
        }
    )
    
    print(f"Created workflow: {parallel_task.title}")
    result = await swarm_manager.execute_workflow(parallel_task)
    print(f"Workflow completed with status: {parallel_task.status}")
    
    print("\n📊 Results:")
    print("-" * 20)
    for agent_type, agent_result in result['results'].items():
        if 'error' in agent_result:
            print(f"  {agent_type}: ❌ {agent_result['error']}")
        else:
            print(f"  {agent_type}: ✅ Success")
            if 'summary' in agent_result:
                print(f"    Summary: {agent_result['summary']}")
    
    print("\n✅ Debug completed!")
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(debug_swarm_protocol())
