import { ethers } from 'ethers';
import { DAO } from './DAO';
import { Agent, Metrics, Experiment } from './Agent';
import { TreasuryGraph } from './TreasuryGraph';
import DAOVotingABI from '../artifacts/DAOVoting.json';
import NFTDeedABI from '../artifacts/NFTDeed.json';

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
}