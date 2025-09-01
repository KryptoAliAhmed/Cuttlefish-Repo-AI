import { ethers } from 'ethers';
import { DAO } from './DAO';
import { Agent, Metrics, Experiment } from './Agent';
import { TreasuryGraph } from './TreasuryGraph';
import DAOVotingABI from '../artifacts/DAOVoting.json';
import NFTDeedABI from '../artifacts/NFTDeed.json';
import * as fs from 'fs';

export class MultiDAOOrchestrator {
  private daos: Map<string, DAO>;
  private provider: ethers.JsonRpcProvider;
  private contractAddresses: { DAOVoting: string; NFTDeed: string };

  constructor(provider: ethers.JsonRpcProvider, deployedContractsPath: string) {
    this.daos = new Map();
    this.provider = provider;
    this.contractAddresses = require(deployedContractsPath);
  }

  addDAO(dao: DAO): void {
    this.daos.set(dao.name, dao);
    console.log(`[Orchestrator] Added DAO ${dao.name}`);
  }

  getDAO(daoId: string): DAO {
    const dao = this.daos.get(daoId);
    if (!dao) throw new Error(`DAO ${daoId} not found`);
    return dao;
  }

  getAgent(agentId: string, daoId: string): Agent {
    const dao = this.getDAO(daoId);
    const agent = dao.agents.find(a => a.id === agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found in DAO ${daoId}`);
    return agent;
  }

  async proposeExperimentInDAO(daoId: string, agent: Agent, experiment: Experiment): Promise<any> {
    const dao = this.getDAO(daoId);
    console.log(`[Orchestrator] Proposing experiment ${experiment.description} in DAO ${daoId} by agent ${agent.id}`);
    return { experimentId: experiment.id, status: 'Proposed' };
  }

  async proposeNormUpdateOnChain(
    daoId: string,
    agentId: string,
    description: string,
    financialKernel: number,
    ecologicalKernel: number,
    socialKernel: number,
    duration: number,
    signer?: ethers.Signer
  ): Promise<any> {
    if (!signer) throw new Error('Signer required for on-chain proposal');
    const dao = this.getDAO(daoId);
    const votingContract = new ethers.Contract(this.contractAddresses.DAOVoting, DAOVotingABI.abi, signer);
    console.log(`[Orchestrator] Proposing kernel update in DAO ${daoId} by agent ${agentId}: ${financialKernel}-${ecologicalKernel}-${socialKernel}`);
    const tx = await votingContract.createKernelUpdateProposal(description, financialKernel, ecologicalKernel, socialKernel, duration);
    const receipt = await tx.wait();
    await dao.syncEthicalKernels();
    return receipt;
  }

  async proposeBTCAllocation(
    daoId: string,
    agentId: string,
    amountUSD: number,
    duration: number,
    signer?: ethers.Signer
  ): Promise<any> {
    if (!signer) throw new Error('Signer required for on-chain proposal');
    const dao = this.getDAO(daoId);
    const votingContract = new ethers.Contract(this.contractAddresses.DAOVoting, DAOVotingABI.abi, signer);
    console.log(`[Orchestrator] Proposing BTC allocation of $${amountUSD} in DAO ${daoId} by agent ${agentId}`);
    const tx = await votingContract.createBTCAllocationProposal(`Allocate $${amountUSD} to BTC`, amountUSD, duration);
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      dao.treasuryGraph.handleBTCAllocation(receipt.logs[0].args[0], amountUSD);
    }
    return receipt;
  }

  async mintNFTDeed(daoId: string, toAddress: string, tokenURI: string, signer?: ethers.Signer): Promise<any> {
    if (!signer) throw new Error('Signer required for NFT minting');
    const nftContract = new ethers.Contract(this.contractAddresses.NFTDeed, NFTDeedABI.abi, signer);
    console.log(`[Orchestrator] Minting NFT deed to ${toAddress} in DAO ${daoId} with URI ${tokenURI}`);
    const tx = await nftContract.mint(toAddress, tokenURI);
    return await tx.wait();
  }

  async voteProposal(daoId: string, proposalId: number, support: boolean, signer: ethers.Signer): Promise<any> {
    const votingContract = new ethers.Contract(this.contractAddresses.DAOVoting, DAOVotingABI.abi, signer);
    console.log(`[Orchestrator] Voting ${support ? 'for' : 'against'} proposal ${proposalId} in DAO ${daoId}`);
    const tx = await votingContract.vote(proposalId, support);
    return await tx.wait();
  }

  async getEthicalKernels(daoId: string): Promise<{ financial: number; ecological: number; social: number }> {
    const votingContract = new ethers.Contract(this.contractAddresses.DAOVoting, DAOVotingABI.abi, this.provider);
    const [financial, ecological, social] = await votingContract.getEthicalKernels();
    console.log(`[Orchestrator] Retrieved kernels for DAO ${daoId}: ${financial}-${ecological}-${social}`);
    return { financial, ecological, social };
  }

  async getProposalDetails(daoId: string, proposalId: number): Promise<any> {
    const votingContract = new ethers.Contract(this.contractAddresses.DAOVoting, DAOVotingABI.abi, this.provider);
    const proposal = await votingContract.proposals(proposalId);
    console.log(`[Orchestrator] Retrieved proposal ${proposalId} for DAO ${daoId}`);
    return {
      id: proposal.id,
      description: proposal.description,
      type: proposal.pType,
      votesFor: proposal.votesFor.toString(),
      votesAgainst: proposal.votesAgainst.toString(),
      deadline: proposal.deadline.toString(),
      executed: proposal.executed,
      newFinancialKernel: proposal.newFinancialKernel,
      newEcologicalKernel: proposal.newEcologicalKernel,
      newSocialKernel: proposal.newSocialKernel,
      btcAmountUSD: proposal.btcAmountUSD.toString()
    };
  }

  async listProposals(daoId: string): Promise<any[]> {
    const votingContract = new ethers.Contract(this.contractAddresses.DAOVoting, DAOVotingABI.abi, this.provider);
    const proposalCount = Number(await votingContract.proposalCount());
    const proposals = [];
    for (let i = 1; i <= proposalCount; i++) {
      const proposal = await votingContract.proposals(i);
      proposals.push({
        id: proposal.id,
        description: proposal.description,
        type: proposal.pType,
        votesFor: proposal.votesFor.toString(),
        votesAgainst: proposal.votesAgainst.toString(),
        deadline: proposal.deadline.toString(),
        executed: proposal.executed,
        newFinancialKernel: proposal.newFinancialKernel,
        newEcologicalKernel: proposal.newEcologicalKernel,
        newSocialKernel: proposal.newSocialKernel,
        btcAmountUSD: proposal.btcAmountUSD.toString()
      });
    }
    console.log(`[Orchestrator] Retrieved ${proposals.length} proposals for DAO ${daoId}`);
    return proposals;
  }

  async getBTCTreasuryBalance(daoId: string): Promise<number> {
    const dao = this.getDAO(daoId);
    const balance = dao.treasuryGraph.getTotalBTC();
    console.log(`[Orchestrator] Retrieved BTC treasury balance for DAO ${daoId}: ${balance} BTC`);
    return balance;
  }

  async debugSmartContract(daoId: string, contractName: string, errorMessage: string, fixCode?: string, commitMessage?: string): Promise<any> {
    const dao = this.getDAO(daoId);
    const votingContract = new ethers.Contract(this.contractAddresses.DAOVoting, DAOVotingABI.abi, this.provider);
    const contractPath = `contracts/${contractName}.sol`;
    const contractSource = fs.readFileSync(contractPath, 'utf8');

    // Fetch recent transaction logs for errors
    const filter = votingContract.filters.Error();
    const logs = await votingContract.queryFilter(filter, -1000);
    const errorLogs = logs.map(log => ({
      message: log.args?.message || 'Unknown error',
      txHash: log.transactionHash
    }));

    // Analyze root cause and propose fix (mocked for simplicity; use LLM in production)
    let rootCause = '';
    let proposedFixCode = fixCode || contractSource;
    let proposedCommitMessage = commitMessage || `Fix ${errorMessage} in ${contractName}`;
    if (errorMessage.includes('Proposal not found')) {
      rootCause = 'Attempted to access a non-existent proposal ID in vote function.';
      if (!fixCode) {
        proposedFixCode = contractSource.replace(
          'require(proposals[_proposalId].deadline > block.timestamp, "Proposal not found or expired");',
          'require(_proposalId > 0 && _proposalId <= proposalCount, "Invalid proposal ID");\n        require(proposals[_proposalId].deadline > block.timestamp, "Proposal expired");'
        );
        proposedCommitMessage = `Add explicit proposal ID validation in ${contractName}`;
      }
    } else {
      rootCause = 'Unknown error in contract execution.';
    }

    console.log(`[Orchestrator] Debugged ${contractName} for DAO ${daoId}: Root cause: ${rootCause}`);
    return {
      contractName,
      errorMessage,
      rootCause,
      fixCode: proposedFixCode,
      contractPath,
      errorLogs,
      commitMessage: proposedCommitMessage
    };
  }
}