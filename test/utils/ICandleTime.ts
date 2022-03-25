import { Contract } from "ethers";
import { TimeUnit } from "../test-helpers";

export interface ICandleTime extends Contract {
  getCandleStartTime(timeUnit: TimeUnit, timeframe: number): number;
}
