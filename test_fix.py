#!/usr/bin/env python3
"""
Simple test script to verify the swarm protocol fix
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from swarm_protocol import SwarmProtocolManager, AgentType, WorkflowType

async def test_fix():
    """Test the fixed swarm protocol"""
    print("🐙 Testing Fixed Swarm Protocol")
    print("=" * 40)
    
    # Create swarm manager
    swarm_manager = SwarmProtocolManager()
    
    # Create a workflow with all agents
    task = await swarm_manager.create_workflow(
        title="Test All Agents",
        description="Test all agents in parallel",
        workflow_type=WorkflowType.PARALLEL,
        agents=[
            AgentType.PREDICTIVE_AGENT,
            AgentType.BUILDER_AGENT,
            AgentType.SIGNAL_AGENT,
            AgentType.COMPLIANCE_AGENT,
            AgentType.PERMIT_AGENT,
            AgentType.REFACTOR_AGENT,
            AgentType.META_AUDITOR
        ],
        context={
            "proposal": "solar_farm_optimization",
            "budget": 1000000
        }
    )
    
    # Execute the workflow
    result = await swarm_manager.execute_workflow(task)
    
    print(f"✅ Workflow completed: {task.status}")
    print(f"📊 Results:")
    
    # Check results
    all_success = True
    for agent_type, agent_result in result['results'].items():
        if 'error' in agent_result:
            print(f"  ❌ {agent_type}: {agent_result['error']}")
            all_success = False
        else:
            print(f"  ✅ {agent_type}: Success")
    
    if all_success:
        print("\n🎉 All agents working correctly!")
    else:
        print("\n⚠️  Some agents still have issues")
    
    return all_success

if __name__ == "__main__":
    success = asyncio.run(test_fix())
    exit(0 if success else 1)
