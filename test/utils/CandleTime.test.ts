import { ethers } from "hardhat";
import { expect } from "chai";
import { getCandleStartTime, TimeUnit } from "../test-helpers";
import { Contract } from "ethers";
import { ICandleTime } from "./ICandleTime";

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

  // block.timestamp does not work with second timeframe?
  describe("Minute timeframe", () => {
    it("should throw for 0 timeframe", async () => {
      await expect(mockContract.getCandleStartTime(TimeUnit.MINUTE, 0)).to.be
        .reverted;
    });

    it("should work with 1 timeframe", async () => {
      const startTime = await mockContract.getCandleStartTime(
        TimeUnit.MINUTE,
        1
      );
      expect(startTime).to.equals(getCandleStartTime(TimeUnit.MINUTE, 1));
    });

    it("should work with 5 timeframe", async () => {
      const startTime = await mockContract.getCandleStartTime(
        TimeUnit.MINUTE,
        5
      );
      expect(startTime).to.equals(getCandleStartTime(TimeUnit.MINUTE, 5));
    });

    it("should work with 59 timeframe", async () => {
      const startTime = await mockContract.getCandleStartTime(
        TimeUnit.MINUTE,
        59
      );
      expect(startTime).to.equals(getCandleStartTime(TimeUnit.MINUTE, 59));
    });

    it("should throw error for 60 timeframe", async () => {
      await expect(mockContract.getCandleStartTime(TimeUnit.MINUTE, 60)).to.be
        .reverted;
    });
  });
});
