import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import IBeatThatCoin from "./IBeatThatCoin";
import { getCandleStartTime, TimeUnit } from "./test-helpers";

const COST_PER_VOTE = ethers.utils.parseEther("0.01");
const PRIZE_SHARES = [40, 30, 20];
const TIMEFRAME = 1;
const TIME_UNIT = TimeUnit.MINUTE;

describe("BeatThatCoin", () => {
  let contract: IBeatThatCoin;
  let deployer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async () => {
    [deployer, user1, user2] = await ethers.getSigners();
    const candleTimeLibrary = await (
      await ethers.getContractFactory("CandleTime")
    ).deploy();
    await candleTimeLibrary.deployed();
    const votingSetLibrary = await (
      await ethers.getContractFactory("VotingSet")
    ).deploy();
    await votingSetLibrary.deployed();
    contract = (await (
      await ethers.getContractFactory("BeatThatCoin", {
        libraries: {
          CandleTime: candleTimeLibrary.address,
        },
      })
    ).deploy(
      deployer.address,
      COST_PER_VOTE,
      PRIZE_SHARES,
      TIME_UNIT,
      TIMEFRAME
    )) as unknown as IBeatThatCoin;
    await contract.deployed();
  });

  it("should set default configuration correctly", async () => {
    expect(await contract.beneficiary()).to.equals(deployer.address);
    expect(await contract.costPerVote()).to.equals(COST_PER_VOTE);
    expect(await contract.prizeShares(0)).to.eql(PRIZE_SHARES[0]);
    expect(await contract.timeUnit()).to.equals(TIME_UNIT);
    expect(await contract.timeframe()).to.equals(TIMEFRAME);
  });

  it("should allow only owner to set configuration", async () => {
    await expect(contract.connect(user1).setBeneficiary(user1.address)).to.be
      .reverted;
    await expect(contract.connect(user1).setCostPerVote(COST_PER_VOTE)).to.be
      .reverted;
    await expect(contract.connect(user1).setPrizeShares(PRIZE_SHARES)).to.be
      .reverted;
    await expect(contract.connect(user1).setTimeframe(TIMEFRAME)).to.be
      .reverted;
    await expect(contract.connect(user1).setTimeUnit(TIME_UNIT)).to.be.reverted;
  });
});
