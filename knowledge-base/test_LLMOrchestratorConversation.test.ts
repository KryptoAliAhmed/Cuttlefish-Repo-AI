import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { processUserCommand, clearConversationHistory } from '../src/LLMOrchestrator';
import { MultiDAOOrchestrator } from '../src/MultiDAOOrchestrator';
import { DAO } from '../src/DAO';
import { DAOSettings } from '../src/DAOSettings';

describe('LLMOrchestrator Multi-Step Conversation', function () {
  async function deployContractsFixture() {
    const [owner, voter] = await ethers.getSigners();
    const Token = await ethers.getContractFactory('DAOREITToken');
    const token = await Token.deploy('GreenIslandDAO', 'GID', ethers.parseEther('1000000'));
    await token.waitForDeployment();
    await token.transfer(voter.address, ethers.parseEther('100'));

    const Voting = await ethers.getContractFactory('DAOVoting');
    const voting = await Voting.deploy(token.getAddress(), owner.address);
    await voting.waitForDeployment();

    const NFT = await ethers.getContractFactory('NFTDeed');
    const nft = await NFT.deploy('RegenerativeAsset', 'REGEN');
    await nft.waitForDeployment();

    const deployed = {
      DAOREITToken: await token.getAddress(),
      DAOVoting: await voting.getAddress(),
      NFTDeed: await nft.getAddress()
    };
    require('fs').writeFileSync('deployed.json', JSON.stringify(deployed, null, 2));

    const provider = ethers.provider;
    const orchestrator = new MultiDAOOrchestrator(provider, './deployed.json');
    const daoSettings: DAOSettings = {
      name: 'AIClusterDAO-Azores',
      totalSupply: 1000000,
      treasuryPolicy: { bitcoinAllocation: 0.6, cardanoAllocation: 0.3, stablecoinAllocation: 0.1 },
      bitcoinAccumulationPolicy: { enabled: true, targetBTCPerToken: '0.00002', allocationFromRegenDividends: 0.15 },
      votingWeights: { community: 1, experts: 3, funders: 5 },
      escrowPolicy: { highRisk: 14, normalRisk: 5 },
      ethicalKernels: { financial: 55, ecological: 30, social: 15 }
    };
    const dao = new DAO(daoSettings);
    orchestrator.addDAO(dao);

    return { orchestrator, voting, owner, voter };
  }

  beforeEach(async () => {
    await clearConversationHistory();
  });

  it('should handle multi-step conversation for kernel update and query', async function () {
    const { voting, owner } = await loadFixture(deployContractsFixture);
    process.env.OPENAI_API_KEY = 'mock-key'; // Mock for testing

    // Step 1: Create kernel update proposal
    const instruction1 = 'Update ethical kernels in AIClusterDAO-Azores to 40-40-20 for 7 days.';
    const result1 = await processUserCommand(instruction1, owner);
    expect(result1.status).to.equal(1);

    // Step 2: Query proposal details
    const instruction2 = 'Can you clarify the proposal details?';
    const result2 = await processUserCommand(instruction2, owner);
    expect(result2.id).to.equal(1);
    expect(result2.description).to.equal('Update ethical kernels to 40-40-20');
    expect(result2.newFinancialKernel).to.equal(40);
    expect(result2.newEcologicalKernel).to.equal(40);
    expect(result2.newSocialKernel).to.equal(20);

    // Step 3: Query current kernels
    const instruction3 = 'What are the current kernels?';
    const result3 = await processUserCommand(instruction3, owner);
    expect(result3.financial).to.equal(55); // Before execution
    expect(result3.ecological).to.equal(30);
    expect(result3.social).to.equal(15);

    // Execute proposal
    await ethers.provider.send('evm_increaseTime', [604801]);
    await ethers.provider.send('evm_mine', []);
    await voting.executeProposal(1);

    // Step 4: Query kernels after execution
    const instruction4 = 'What are the current kernels?';
    const result4 = await processUserCommand(instruction4, owner);
    expect(result4.financial).to.equal(40);
    expect(result4.ecological).to.equal(40);
    expect(result4.social).to.equal(20);
  });

  it('should handle BTC allocation and follow-up query', async function () {
    const { owner } = await loadFixture(deployContractsFixture);
    process.env.OPENAI_API_KEY = 'mock-key';

    // Step 1: Create BTC allocation proposal
    const instruction1 = 'Allocate $25000 to BTC for AIClusterDAO-Azores for 30 days.';
    const result1 = await processUserCommand(instruction1, owner);
    expect(result1.status).to.equal(1);

    // Step 2: Query proposal details
    const instruction2 = 'Can you clarify the proposal details?';
    const result2 = await processUserCommand(instruction2, owner);
    expect(result2.id).to.equal(1);
    expect(result2.btcAmountUSD).to.equal('25000');
  });
});