import { ethers } from "hardhat";
import IBeatThatCoin from "../test/IBeatThatCoin";
import { TimeUnit } from "../test/test-helpers";

const COST_PER_VOTE = ethers.utils.parseEther("0.01");
const PRIZE_SHARES = [40, 30, 20];
const TIMEFRAME = 1;
const TIME_UNIT = TimeUnit.MINUTE;

async function main() {
  const [deployer] = await ethers.getSigners();
  const candleTimeLibrary = await (
    await ethers.getContractFactory("CandleTime")
  ).deploy();
  await candleTimeLibrary.deployed();
  let contract = (await (
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

  console.log("BeatThatCoin is deployed to: ", contract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
