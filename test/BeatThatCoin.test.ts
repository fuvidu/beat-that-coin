import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import IBeatThatCoin from "./IBeatThatCoin";
import {
  arrayRandomValue,
  getCandleStartTime,
  TimeUnit,
  Vote,
  wait,
} from "./test-helpers";

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

  describe("configuration", () => {
    it("should set default configuration correctly", async () => {
      expect(await contract.beneficiary()).to.equals(deployer.address);
      expect(await contract.costPerVote()).to.equals(COST_PER_VOTE);
      expect(await contract.prizeShares(0)).to.eql(PRIZE_SHARES[0]);
      expect(await contract.timeUnit()).to.equals(TIME_UNIT);
      expect(await contract.timeframe()).to.equals(TIMEFRAME);
    });

    it("should allow only owner to set configuration", async () => {
      await contract.pause();
      await expect(contract.connect(user1).setBeneficiary(user1.address)).to.be
        .reverted;
      await expect(contract.setBeneficiary(deployer.address)).to.not.be
        .reverted;

      await expect(contract.connect(user1).setCostPerVote(COST_PER_VOTE)).to.be
        .reverted;
      await expect(contract.setCostPerVote(COST_PER_VOTE)).to.not.be.reverted;

      await expect(contract.connect(user1).setPrizeShares(PRIZE_SHARES)).to.be
        .reverted;
      await expect(contract.setPrizeShares(PRIZE_SHARES)).to.not.be.reverted;

      await expect(contract.connect(user1).setTimeframe(TIMEFRAME)).to.be
        .reverted;
      await expect(contract.setTimeframe(TIMEFRAME)).to.not.be.reverted;

      await expect(contract.connect(user1).setTimeUnit(TIME_UNIT)).to.be
        .reverted;
      await expect(contract.setTimeUnit(TIME_UNIT)).to.not.be.reverted;
      await contract.unpause();
    });
  });

  describe("Voting", () => {
    it("should not allow to vote with different cost per vote", async () => {
      await expect(
        contract.setVoting(Vote.Up, { value: COST_PER_VOTE.sub(1) })
      ).to.be.revertedWith("Cost does not match");
    });

    it("should allow multiple users to vote", async () => {
      await contract.setVoting(Vote.Down, { value: COST_PER_VOTE });
      await contract
        .connect(user1)
        .setVoting(Vote.Down, { value: COST_PER_VOTE });
      await contract
        .connect(user2)
        .setVoting(Vote.Up, { value: COST_PER_VOTE });
      const candleStartTime = getCandleStartTime(TIME_UNIT, TIMEFRAME);
      expect(await contract.getTotalVotes(candleStartTime)).to.equals(2);
      expect(await contract.getTotalFunds()).to.equals(COST_PER_VOTE.mul(3));
    });

    it("should return the correct vote value", async () => {
      const candleStartTime = getCandleStartTime(TIME_UNIT, TIMEFRAME);
      await contract.setVoting(Vote.Down, { value: COST_PER_VOTE });
      await contract
        .connect(user1)
        .setVoting(Vote.Down, { value: COST_PER_VOTE });
      await contract
        .connect(user2)
        .setVoting(Vote.Up, { value: COST_PER_VOTE });
      expect(await contract.getVote(candleStartTime, user2.address)).to.equals(
        Vote.Up
      );
    });

    it("should allow same user to vote in different timeframe", async () => {
      const candleStartTime1 = getCandleStartTime(TIME_UNIT, TIMEFRAME);
      await contract.setVoting(Vote.Down, { value: COST_PER_VOTE });

      await wait(10 * 1000);

      await contract.pause();
      await contract.setTimeUnit(TimeUnit.SECOND);
      await contract.setTimeframe(10);
      await contract.unpause();

      const candleStartTime2 = getCandleStartTime(TimeUnit.SECOND, 10);
      await contract.setVoting(Vote.Up, { value: COST_PER_VOTE });

      expect(await contract.balanceOf(deployer.address)).to.equals(
        COST_PER_VOTE.mul(2)
      );
      expect(
        await contract.getVote(candleStartTime1, deployer.address)
      ).to.equals(Vote.Down);
      expect(
        await contract.getVote(candleStartTime2, deployer.address)
      ).to.equals(Vote.Up);
    });
  });

  describe("Release prize", () => {
    it("should transfer balances to the winners and the beneficiary", async () => {
      type UserBalance = {
        address: string;
        balance: BigNumber;
      };
      const candleStartTime = getCandleStartTime(TIME_UNIT, TIMEFRAME);
      const users = await ethers.getSigners();
      const beneficiary = users[1].address;
      const balanceOfBeneficiary = await contract.balanceOf(beneficiary);
      await contract.pause();
      await contract.setBeneficiary(beneficiary);
      await contract.unpause();
      const votes: { [key: number]: UserBalance[] } = {};
      // skip the deployer and the beneficiary
      for (let i = 2; i < Math.max(users.length, 10); i++) {
        const vote = arrayRandomValue([Vote.Up, Vote.Down]);
        const user = users[i];
        await contract.connect(user).setVoting(vote, {
          value: COST_PER_VOTE,
        });

        if (!votes[vote]) {
          votes[vote] = [
            {
              address: user.address,
              balance: await contract.balanceOf(user.address),
            },
          ];
        } else {
          votes[vote].push({
            address: user.address,
            balance: await contract.balanceOf(user.address),
          });
        }
      }

      const winnerVote = arrayRandomValue([Vote.Up, Vote.Down]);
      const loserVote = winnerVote === Vote.Up ? Vote.Down : Vote.Up;
      const losers = votes[loserVote];
      const totalPrizeValue = COST_PER_VOTE.mul(losers.length);

      await contract.releasePrizes(candleStartTime, winnerVote);
      const winners = votes[winnerVote];
      let winnerShares = 0;
      for (let j = 0; j < PRIZE_SHARES.length; j++) {
        const share = PRIZE_SHARES[j];
        winnerShares += share;
        const amount = totalPrizeValue.mul(share).div(100);
        const winner = winners[j];
        expect(await contract.balanceOf(winner.address)).to.equals(
          winner.balance.add(amount)
        );
      }

      const beneficiaryShares = 100 - winnerShares;
      const beneficiaryAmount = totalPrizeValue.mul(beneficiaryShares).div(100);
      expect(await contract.balanceOf(beneficiary)).to.equals(
        balanceOfBeneficiary.add(beneficiaryAmount)
      );
    });

    it("should deduct balances of the losers", async () => {
      type UserBalance = {
        address: string;
        balance: BigNumber;
      };
      const candleStartTime = getCandleStartTime(TIME_UNIT, TIMEFRAME);
      const users = await ethers.getSigners();
      const votes: { [key: number]: UserBalance[] } = {};
      // skip the deployer and the beneficiary
      for (let i = 2; i < Math.max(users.length, 10); i++) {
        const vote = arrayRandomValue([Vote.Up, Vote.Down]);
        const user = users[i];
        await contract.connect(user).setVoting(vote, {
          value: COST_PER_VOTE,
        });

        if (!votes[vote]) {
          votes[vote] = [
            {
              address: user.address,
              balance: await contract.balanceOf(user.address),
            },
          ];
        } else {
          votes[vote].push({
            address: user.address,
            balance: await contract.balanceOf(user.address),
          });
        }
      }

      const winnerVote = arrayRandomValue([Vote.Up, Vote.Down]);
      const loserVote = winnerVote === Vote.Up ? Vote.Down : Vote.Up;
      const losers = votes[loserVote];

      await contract.releasePrizes(candleStartTime, winnerVote);

      for (let i = 0; i < losers.length; i++) {
        const loser = losers[i];
        expect(await contract.balanceOf(loser.address)).to.equals(
          loser.balance.sub(COST_PER_VOTE)
        );
      }
    });

    it("should retain the balances of the users having correct vote but not are winners", async () => {
      type UserBalance = {
        address: string;
        balance: BigNumber;
      };
      const candleStartTime = getCandleStartTime(TIME_UNIT, TIMEFRAME);
      const users = await ethers.getSigners();
      const votes: { [key: number]: UserBalance[] } = {};
      // skip the deployer and the beneficiary
      for (let i = 2; i < Math.max(users.length, 10); i++) {
        const vote = arrayRandomValue([Vote.Up, Vote.Down]);
        const user = users[i];
        await contract.connect(user).setVoting(vote, {
          value: COST_PER_VOTE,
        });

        if (!votes[vote]) {
          votes[vote] = [
            {
              address: user.address,
              balance: await contract.balanceOf(user.address),
            },
          ];
        } else {
          votes[vote].push({
            address: user.address,
            balance: await contract.balanceOf(user.address),
          });
        }
      }

      const winnerVote = arrayRandomValue([Vote.Up, Vote.Down]);
      const notLosers = votes[winnerVote];

      await contract.releasePrizes(candleStartTime, winnerVote);

      for (let i = PRIZE_SHARES.length; i < notLosers.length; i++) {
        const notLoser = notLosers[i];
        expect(await contract.balanceOf(notLoser.address)).to.equals(
          notLoser.balance
        );
      }
    });

    it("should not allow to release the same candle twice", async () => {
      const candleStartTime = getCandleStartTime(TIME_UNIT, TIMEFRAME);
      const users = await ethers.getSigners();
      for (let i = 2; i < Math.max(users.length, 10); i++) {
        const vote = arrayRandomValue([Vote.Up, Vote.Down]);
        const user = users[i];
        await contract.connect(user).setVoting(vote, {
          value: COST_PER_VOTE,
        });
      }
      await contract.releasePrizes(candleStartTime, Vote.Up);
      await expect(
        contract.releasePrizes(candleStartTime, Vote.Up)
      ).to.be.revertedWith("Prizes already released");
    });

    it("should allow to release prizes on different candles", async () => {
      const candleStartTime1 = getCandleStartTime(TIME_UNIT, TIMEFRAME);
      const users = await ethers.getSigners();
      for (let i = 2; i < Math.max(users.length, 10); i++) {
        const vote = arrayRandomValue([Vote.Up, Vote.Down]);
        const user = users[i];
        await contract.connect(user).setVoting(vote, {
          value: COST_PER_VOTE,
        });
      }
      await contract.releasePrizes(candleStartTime1, Vote.Up);

      await wait(10000);
      await contract.pause();
      await contract.setTimeUnit(TimeUnit.SECOND);
      await contract.setTimeframe(10);
      await contract.unpause();
      for (let i = 2; i < Math.max(users.length, 10); i++) {
        const vote = arrayRandomValue([Vote.Up, Vote.Down]);
        const user = users[i];
        await contract.connect(user).setVoting(vote, {
          value: COST_PER_VOTE,
        });
      }
      const candleStartTime2 = getCandleStartTime(TimeUnit.SECOND, 10);
      await expect(contract.releasePrizes(candleStartTime2, Vote.Down)).to.not
        .be.reverted;
    });
  });

  describe("Withdraw", () => {});
});
