//SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../../utils/CandleTime.sol";

contract CandleTimeMock {
    function getCandleStartTime(CandleTime.TimeUnit timeUnit, uint8 timeframe)
        public
        view
        returns (uint256)
    {
        return CandleTime.getCandleStartTime(timeUnit, timeframe);
    }
}
