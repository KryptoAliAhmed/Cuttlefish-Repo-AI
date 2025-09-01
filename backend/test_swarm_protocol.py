#!/usr/bin/env python3
"""
Test script for Swarm Protocol implementation
"""

import asyncio
import json
from swarm_protocol import SwarmProtocolManager, AgentType, WorkflowType

async def test_swarm_protocol():
    """Test the Swarm Protocol implementation"""
    print("🐙 Testing Swarm Protocol Implementation")
    print("=" * 50)
    
    # Initialize Swarm Protocol Manager
    swarm_manager = SwarmProtocolManager()
    await swarm_manager.initialize_agents()
    
    print(f"✅ Initialized {len(swarm_manager.protocol.agents)} agents")
    
    # Test 1: Sequential Workflow
    print("\n🧪 Test 1: Sequential Workflow")
    print("-" * 30)
    
    sequential_task = await swarm_manager.create_workflow(
        title="Solar Farm Optimization",
        description="Optimize solar farm layout and energy yield",
        workflow_type=WorkflowType.SEQUENTIAL,
        agents=[AgentType.BUILDER_AGENT, AgentType.PERMIT_AGENT],
        context={
            "proposal": "solar_farm_optimization",
            "budget": 2000000,
            "location": "Arizona"
        }
    )
    
    print(f"Created sequential workflow: {sequential_task.title}")
    result = await swarm_manager.execute_workflow(sequential_task)
    print(f"Workflow completed with status: {sequential_task.status}")
    print(f"Result: {json.dumps(result, indent=2)}")
    
    # Test 2: Parallel Workflow
    print("\n🧪 Test 2: Parallel Workflow")
    print("-" * 30)
    
    parallel_task = await swarm_manager.create_workflow(
        title="Market Analysis & Compliance",
        description="Analyze market conditions and check compliance simultaneously",
        workflow_type=WorkflowType.PARALLEL,
        agents=[AgentType.SIGNAL_AGENT, AgentType.PERMIT_AGENT],
        context={
            "market_data": {"asset": "E2R", "timeframe": "1d"},
            "compliance_check": "infrastructure"
        }
    )
    
    print(f"Created parallel workflow: {parallel_task.title}")
    result = await swarm_manager.execute_workflow(parallel_task)
    print(f"Workflow completed with status: {parallel_task.status}")
    print(f"Result: {json.dumps(result, indent=2)}")
    
    # Test 3: TrustGraph Entries
    print("\n🧪 Test 3: TrustGraph Entries")
    print("-" * 30)
    
    entries = await swarm_manager.get_trust_graph(limit=10)
    print(f"Retrieved {len(entries)} TrustGraph entries")
    
    for i, entry in enumerate(entries[:3]):
        print(f"Entry {i+1}:")
        print(f"  Agent: {entry['agent_action']['agent_type']}")
        print(f"  Action: {entry['agent_action']['action']}")
        print(f"  Hash: {entry['current_hash'][:16]}...")
        print()
    
    # Test 4: Workflow Status
    print("\n🧪 Test 4: Workflow Status")
    print("-" * 30)
    
    status = await swarm_manager.get_workflow_status(sequential_task.task_id)
    if status:
        print(f"Workflow Status: {status['status']}")
        print(f"Title: {status['title']}")
        print(f"Agents: {', '.join(status['agents'])}")
    
    print("\n✅ All tests completed successfully!")
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(test_swarm_protocol())
