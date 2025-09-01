// --- contracts/DAOREITToken.sol ---

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DAOREITToken is ERC20 {
    address public daoTreasury;

    constructor(string memory name, string memory symbol, uint256 initialSupply, address treasury) ERC20(name, symbol) {
        _mint(treasury, initialSupply);
        daoTreasury = treasury;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == daoTreasury, "Only DAO treasury can mint");
        _mint(to, amount);
    }
}

// --- contracts/NFTDeed.sol ---

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTDeed is ERC721 {
    uint256 public nextTokenId;
    address public daoTreasury;

    constructor(string memory name, string memory symbol, address treasury) ERC721(name, symbol) {
        daoTreasury = treasury;
    }

    function mint(address to) external returns (uint256) {
        require(msg.sender == daoTreasury, "Only DAO treasury can mint deeds");
        uint256 tokenId = nextTokenId;
        _mint(to, tokenId);
        nextTokenId++;
        return tokenId;
    }
}

// --- contracts/DAOVoting.sol ---

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IDAOREITToken {
    function balanceOf(address account) external view returns (uint256);
}

contract DAOVoting {
    struct Proposal {
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        bool executed;
    }

    Proposal[] public proposals;
    address public daoToken;

    mapping(uint256 => mapping(address => bool)) public hasVoted;

    constructor(address tokenAddress) {
        daoToken = tokenAddress;
    }

    function createProposal(string memory desc, uint256 duration) external {
        proposals.push(Proposal(desc, 0, 0, block.timestamp + duration, false));
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp < p.deadline, "Voting closed");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        uint256 voterWeight = IDAOREITToken(daoToken).balanceOf(msg.sender);
        require(voterWeight > 0, "No voting power");

        if (support) p.votesFor += voterWeight;
        else p.votesAgainst += voterWeight;

        hasVoted[proposalId][msg.sender] = true;
    }

    function executeProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp >= p.deadline, "Voting not ended");
        require(!p.executed, "Already executed");

        p.executed = true;
        // logic for effect could be added here (emit event, call treasury, etc.)
    }
}

// --- src/AIAgentController.ts ---

export class AIAgentController {
  orchestrator: any;

  constructor(orchestrator: any) {
    this.orchestrator = orchestrator;
  }

  async handleNaturalLanguageTask(input: string) {
    if (input.includes("propose")) {
      console.log("Planning proposal based on: ", input);
      await this.orchestrator.proposeInDAO("AIClusterDAO-Azores", "BuilderX", {
        description: "Deploy new geothermal GPU hub",
        projectedMetrics: { financial: 100, ecological: 95, social: 90 },
        isHighRisk: true
      });
    } else if (input.includes("mint NFT")) {
      console.log("Minting NFT for infrastructure asset.");
      await this.orchestrator.mintInfrastructureNFT("AzoresGPUHub001", "BuilderX");
    } else {
      console.log("No recognized action.");
    }
  }
}

// --- src/Agent.ts updated snippet ---

simulateKPI(daoRules: any): any {
  const weightedScore = (this.goals.financial * daoRules.ethicalKernels.financial +
                         this.goals.ecological * daoRules.ethicalKernels.ecological +
                         this.goals.social * daoRules.ethicalKernels.social) / 100;
  this.log(`Simulated KPI under ${daoRules.name}: ${weightedScore.toFixed(2)}`);
  return weightedScore;
}
