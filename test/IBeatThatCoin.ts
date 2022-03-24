import { Contract, ContractTransaction } from "ethers";

export default interface IBeatThatCoin extends Contract {
  setVoting(upOrDown: number): Promise<ContractTransaction>;
  getVoteCount(minuteTimestamp: number): Promise<number>;
  getVote(minuteTimestamp: number, voter: string): Promise<number>;
}
