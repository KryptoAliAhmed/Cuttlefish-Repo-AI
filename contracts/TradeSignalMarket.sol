// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title TradeSignalMarket
/// @notice Demo contract emitting mock market opportunities and agent signals.
contract TradeSignalMarket {
    event OpportunityPosted(uint256 indexed id, address tokenA, address tokenB, uint256 expectedApyBps);
    event AgentSignal(uint256 indexed agentId, uint256 indexed opportunityId, bytes signalData);

    struct Opportunity {
        address tokenA;
        address tokenB;
        uint256 expectedApyBps;
        bool active;
    }

    uint256 public nextId = 1;
    mapping(uint256 => Opportunity) public opportunities;

    function postOpportunity(address tokenA, address tokenB, uint256 expectedApyBps) external returns (uint256 id) {
        id = nextId++;
        opportunities[id] = Opportunity({ tokenA: tokenA, tokenB: tokenB, expectedApyBps: expectedApyBps, active: true });
        emit OpportunityPosted(id, tokenA, tokenB, expectedApyBps);
    }

    function closeOpportunity(uint256 id) external {
        opportunities[id].active = false;
    }

    function emitAgentSignal(uint256 agentId, uint256 opportunityId, bytes calldata signalData) external {
        require(opportunities[opportunityId].active, "Inactive");
        emit AgentSignal(agentId, opportunityId, signalData);
    }
}


