import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import IBeatThatCoin from "./IBeatThatCoin";
import { getCandleStartTime, TimeUnit } from "./test-helpers";

describe("BeatThatCoin", () => {
  let contract: IBeatThatCoin;
  let library: Contract;
  let deployer: SignerWithAddress,
    user1: SignerWithAddress,
    user2: SignerWithAddress,
    user3,
    user4,
    user5;

  beforeEach(async () => {
    [deployer, user1, user2, user3, user4, user5] = await ethers.getSigners();
    library = await (await ethers.getContractFactory("CandleTime")).deploy();
    await library.deployed();
    contract = (await (
      await ethers.getContractFactory("BeatThatCoin", {
        libraries: { CandleTime: library.address },
      })
    ).deploy(
      deployer.address,
      ethers.utils.parseEther("0.01"),
      [40, 30, 20],
      TimeUnit.MINUTE,
      1
    )) as unknown as IBeatThatCoin;
    await contract.deployed();
  });

  describe("Voting", () => {
    it("should set vote", async () => {
      const upOrDown = 1;
      await contract.setVoting(upOrDown);
      expect(
        await contract.getVote(
          getCandleStartTime(TimeUnit.MINUTE, 1),
          deployer.address
        )
      ).to.equals(upOrDown);
    });

    it("should not set invalid vote", async () => {
      await expect(contract.setVoting(0)).to.be.revertedWith(
        "Possible values: 1 or 2"
      );
    });

    it("should increase vote count", async () => {
      await contract.setVoting(1);
      await contract.connect(user1).setVoting(2);
      await contract.connect(user2).setVoting(1);
      expect(
        await contract.getTotalVotes(getCandleStartTime(TimeUnit.MINUTE, 1))
      ).to.be.equals(3);
    });

    // describe("when the candle time changes", async () => {
    //   it("should change the total votes", async () => {

    //   });
    // });
  });
});
