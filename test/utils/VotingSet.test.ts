import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { IVotingSet, Vote } from "./IVotingSet";

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("VotingSet", () => {
  let contract: IVotingSet;
  let deployer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async () => {
    [deployer, user1, user2] = await ethers.getSigners();
    contract = (await (
      await ethers.getContractFactory("VotingSetMock")
    ).deploy()) as unknown as IVotingSet;
  });

  it("should not allow duplicate vote", async () => {
    await contract.setVoting(user1.address, Vote.Up);
    await expect(
      contract.setVoting(user1.address, Vote.Down)
    ).to.be.revertedWith("Already voted");
  });

  it("should allow multiple users to vote", async () => {
    await contract.setVoting(user1.address, Vote.Up);
    await contract.setVoting(user2.address, Vote.Down);
    expect(await contract.getTotalVotes()).to.equal(2);
  });

  it("should set correct vote", async () => {
    await contract.setVoting(user1.address, Vote.Up);
    await contract.setVoting(user2.address, Vote.Up);
    expect(await contract.getVote(user1.address)).to.equal(Vote.Up);
  });

  it("should return correct voter count", async () => {
    await contract.setVoting(user1.address, Vote.Up);
    expect(await contract.getVoterCount(Vote.Up)).to.equals(1);

    await contract.setVoting(user2.address, Vote.Up);
    expect(await contract.getVoterCount(Vote.Up)).to.equals(2);

    await contract.setVoting(deployer.address, Vote.Down);
    expect(await contract.getVoterCount(Vote.Up)).to.equals(2);
    expect(await contract.getVoterCount(Vote.Down)).to.equals(1);
  });

  it("should return correct voter address", async () => {
    await contract.setVoting(user1.address, Vote.Up);
    expect(await contract.getVoter(Vote.Up, 0)).to.equals(user1.address);

    await contract.setVoting(user2.address, Vote.Down);
    expect(await contract.getVoter(Vote.Down, 0)).to.equals(user2.address);

    await expect(contract.getVoter(Vote.Up, 1)).to.be.reverted;
  });

  it("should set prize released", async () => {
    expect(await contract.isPrizeReleased()).to.equals(false);
    await contract.setPrizeReleased(true);
    expect(await contract.isPrizeReleased()).to.equals(true);
  });
});
