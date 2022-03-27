import { Contract, ContractTransaction } from "ethers";

export enum Vote {
  Up = 1,
  Down = 2,
}

export interface IVotingSet extends Contract {
  setVoting(voter: string, vote: number): Promise<ContractTransaction>;
  setPrizeReleased(released: boolean): Promise<ContractTransaction>;
  getVoter(vote: number, index: number): Promise<string>;
  getVote(voter: string): Promise<number>;
  getTotalVotes(): Promise<number>;
  getVoterCount(vote: number): Promise<number>;
  isPrizeReleased(): Promise<boolean>;
}
