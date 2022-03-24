import { ethers } from "hardhat";
import { expect } from "chai";
import { getMinuteStartTime, TimeUnit } from "./utils";
import { Contract } from "ethers";

interface ICandleTime extends Contract {
  getCandleStartTime(timeUnit: TimeUnit, timeframe: number): number;
}

describe("CandleTime library", () => {
  let mockContract: ICandleTime;
  let library: Contract;

  beforeEach(async () => {
    library = await (await ethers.getContractFactory("CandleTime")).deploy();
    await library.deployed();
    mockContract = (await (
      await ethers.getContractFactory("CandleTimeMock", {
        libraries: { CandleTime: library.address },
      })
    ).deploy()) as unknown as ICandleTime;
  });

  describe("Minute", () => {
    it("should work with 0 minute", async () => {
      const startTime = await mockContract.getCandleStartTime(
        TimeUnit.MINUTE,
        1
      );
      expect(startTime).to.equals(getMinuteStartTime(1));
    });

    it("should work with 1 minute", async () => {
      const startTime = await mockContract.getCandleStartTime(
        TimeUnit.MINUTE,
        1
      );
      expect(startTime).to.equals(getMinuteStartTime(1));
    });

    it("should work with 5 minutes", async () => {
      const startTime = await mockContract.getCandleStartTime(
        TimeUnit.MINUTE,
        5
      );
      expect(startTime).to.equals(getMinuteStartTime(5));
    });

    it("should work with 59 minutes", async () => {
      const startTime = await mockContract.getCandleStartTime(
        TimeUnit.MINUTE,
        59
      );
      expect(startTime).to.equals(getMinuteStartTime(59));
    });

    it("should throw error for 60 minutes", async () => {
      await expect(mockContract.getCandleStartTime(TimeUnit.MINUTE, 60)).to.be
        .reverted;
    });
  });
});
