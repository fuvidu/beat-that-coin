import { BigNumber, Contract, ContractTransaction } from "ethers";
import { TimeUnit } from "./test-helpers";

export default interface IBeatThatCoin extends Contract {
  releasePrizes(
    candleStartTime: number,
    winnerVote: number
  ): Promise<ContractTransaction>;
  setVoting(
    vote: number,
    overrideOptions: { value: BigNumber }
  ): Promise<ContractTransaction>;
  getTotalFunds(): Promise<BigNumber>;
  balanceOf(address: string): Promise<BigNumber>;
  withdraw(): Promise<ContractTransaction>;
  getTotalVotes(minuteTimestamp: number): Promise<BigNumber>;
  getVote(minuteTimestamp: number, voter: string): Promise<number>;
  setTimeUnit(timeUint: TimeUnit): Promise<ContractTransaction>;
  timeUnit(): Promise<number>;
  setTimeframe(timeframe: number): Promise<ContractTransaction>;
  timeframe(): Promise<number>;
  setBeneficiary(beneficiary: string): Promise<ContractTransaction>;
  beneficiary(): Promise<string>;
  setCostPerVote(cost: BigNumber): Promise<ContractTransaction>;
  costPerVote(): Promise<BigNumber>;
  setPrizeShares(prizeShares: number[]): Promise<ContractTransaction>;
  prizeShares(index: number): Promise<number[]>;
  pause(): Promise<ContractTransaction>;
  unpause(): Promise<ContractTransaction>;
}
