import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

describe('DAOVoting Kernel Update and BTC Allocation', function () {
  async function deployContractsFixture() {
    const [owner, voter1, voter2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory('DAOREITToken');
    const token = await Token.deploy('GreenIslandDAO', 'GID', ethers.parseEther('1000000'));
    await token.waitForDeployment();
    await token.transfer(voter1.address, ethers.parseEther('100'));
    await token.transfer(voter2.address, ethers.parseEther('50'));

    const Voting = await ethers.getContractFactory('DAOVoting');
    const voting = await Voting.deploy(token.getAddress(), owner.address);
    await voting.waitForDeployment();

    return { token, voting, owner, voter1, voter2 };
  }

  it('should update ethical kernels after successful vote', async function () {
    const { voting, owner, voter1 } = await loadFixture(deployContractsFixture);

    await voting.createKernelUpdateProposal('Update kernels to 40-40-20', 40, 40, 20, 86400);
    await voting.connect(voter1).vote(1, true);
    await ethers.provider.send('evm_increaseTime', [86401]);
    await ethers.provider.send('evm_mine', []);

    await voting.executeProposal(1);
    const [financial, ecological, social] = await voting.getEthicalKernels();
    expect(financial).to.equal(40);
    expect(ecological).to.equal(40);
    expect(social).to.equal(20);
  });

  it('should fail kernel update if weights do not total 100', async function () {
    const { voting } = await loadFixture(deployContractsFixture);
    await expect(
      voting.createKernelUpdateProposal('Invalid weights', 50, 30, 10, 86400)
    ).to.be.revertedWith('Weights must total 100');
  });

  it('should approve BTC allocation after successful vote', async function () {
    const { voting, voter1 } = await loadFixture(deployContractsFixture);
    await voting.createBTCAllocationProposal('Allocate $10000 to BTC', 10000, 86400);
    await voting.connect(voter1).vote(1, true);
    await ethers.provider.send('evm_increaseTime', [86401]);
    await ethers.provider.send('evm_mine', []);

    const tx = await voting.executeProposal(1);
    await expect(tx).to.emit(voting, 'BTCAllocationApproved').withArgs(1, 10000);
  });

  it('should fail voting if no voting power', async function () {
    const { voting, voter1 } = await loadFixture(deployContractsFixture);
    await voting.createKernelUpdateProposal('Update kernels', 40, 40, 20, 86400);
    const token = await ethers.getContractAt('DAOREITToken', await voting.daoToken());
    await token.connect(voter1).transfer(owner.address, ethers.parseEther('100'));
    await expect(voting.connect(voter1).vote(1, true)).to.be.revertedWith('No voting power');
  });
});