import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { processUserCommand } from '../src/LLMOrchestrator';
import { MultiDAOOrchestrator } from '../src/MultiDAOOrchestrator';
import { DAO } from '../src/DAO';
import { DAOSettings } from '../src/DAOSettings';

describe('LLMOrchestrator Integration', function () {
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

  it('should process kernel update proposal', async function () {
    const { voting, owner } = await loadFixture(deployContractsFixture);
    process.env.OPENAI_API_KEY = 'mock-key'; // Mock for testing
    const instruction = 'Update ethical kernels in AIClusterDAO-Azores to 40-40-20 for 7 days.';
    const result = await processUserCommand(instruction, owner);
    expect(result.status).to.equal(1);
    await ethers.provider.send('evm_increaseTime', [604801]);
    await ethers.provider.send('evm_mine', []);
    await voting.executeProposal(1);
    const [financial, ecological, social] = await voting.getEthicalKernels();
    expect(financial).to.equal(40);
    expect(ecological).to.equal(40);
    expect(social).to.equal(20);
  });

  it('should process BTC allocation proposal', async function () {
    const { voting, owner } = await loadFixture(deployContractsFixture);
    process.env.OPENAI_API_KEY = 'mock-key';
    const instruction = 'Allocate $25000 to BTC for AIClusterDAO-Azores for 30 days.';
    const result = await processUserCommand(instruction, owner);
    expect(result.status).to.equal(1);
    await expect(voting.executeProposal(1)).to.emit(voting, 'BTCAllocationApproved').withArgs(1, 25000);
  });

  it('should process NFT minting', async function () {
    const { owner, voter } = await loadFixture(deployContractsFixture);
    process.env.OPENAI_API_KEY = 'mock-key';
    const instruction = `Mint an NFT deed for a coral reef microgrid in AIClusterDAO-Azores to ${voter.address}.`;
    const result = await processUserCommand(instruction, owner);
    expect(result.status).to.equal(1);
  });
});