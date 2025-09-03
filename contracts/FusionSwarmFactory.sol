// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title FusionSwarmFactory
/// @notice Demo-only factory that registers agent IDs and simulates LP provisioning and swaps.
contract FusionSwarmFactory {
    event AgentRegistered(address indexed agent, uint256 indexed agentId);
    event LiquidityAdded(uint256 indexed agentId, address tokenA, address tokenB, uint256 amountA, uint256 amountB);
    event LiquidityRemoved(uint256 indexed agentId, address tokenA, address tokenB, uint256 amountA, uint256 amountB);
    event Swapped(uint256 indexed agentId, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);

    // Simple registry mapping an address to an agent ID
    mapping(address => uint256) public agentIdOf;
    mapping(uint256 => address) public agentOwner;
    uint256 public nextAgentId = 1;

    // Demo vault balances for each agentId per token
    mapping(uint256 => mapping(address => uint256)) public vaultBalanceOf;

    modifier onlyAgent(uint256 agentId) {
        require(agentOwner[agentId] == msg.sender, "Not agent owner");
        _;
    }

    function registerAgent() external returns (uint256 agentId) {
        require(agentIdOf[msg.sender] == 0, "Already registered");
        agentId = nextAgentId++;
        agentIdOf[msg.sender] = agentId;
        agentOwner[agentId] = msg.sender;
        emit AgentRegistered(msg.sender, agentId);
    }

    /// @notice Seed the demo vault balances for an agentId.
    function seedVault(uint256 agentId, address token, uint256 amount) external onlyAgent(agentId) {
        vaultBalanceOf[agentId][token] += amount;
    }

    function addLiquidity(
        uint256 agentId,
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) external onlyAgent(agentId) {
        require(vaultBalanceOf[agentId][tokenA] >= amountA, "Insufficient tokenA");
        require(vaultBalanceOf[agentId][tokenB] >= amountB, "Insufficient tokenB");

        // Burn from vault to simulate depositing into LP
        vaultBalanceOf[agentId][tokenA] -= amountA;
        vaultBalanceOf[agentId][tokenB] -= amountB;

        emit LiquidityAdded(agentId, tokenA, tokenB, amountA, amountB);
    }

    function removeLiquidity(
        uint256 agentId,
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) external onlyAgent(agentId) {
        // Credit back to vault to simulate withdrawing LP
        vaultBalanceOf[agentId][tokenA] += amountA;
        vaultBalanceOf[agentId][tokenB] += amountB;

        emit LiquidityRemoved(agentId, tokenA, tokenB, amountA, amountB);
    }

    function swapTokens(
        uint256 agentId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external onlyAgent(agentId) returns (uint256 amountOut) {
        require(vaultBalanceOf[agentId][tokenIn] >= amountIn, "Insufficient tokenIn");

        // Very naive constant 1:1 demo swap
        amountOut = amountIn;
        require(amountOut >= minAmountOut, "Slippage");

        vaultBalanceOf[agentId][tokenIn] -= amountIn;
        vaultBalanceOf[agentId][tokenOut] += amountOut;

        emit Swapped(agentId, tokenIn, tokenOut, amountIn, amountOut);
    }
}


