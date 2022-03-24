//SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@quant-finance/solidity-datetime/contracts/DateTime.sol";

library CandleTime {
    enum TimeUnit {
        NONE,
        SECOND,
        MINUTE
    }

    function getCandleStartTime(TimeUnit timeUnit, uint8 timeframe)
        public
        view
        returns (uint256)
    {
        require(timeframe > 0 && timeframe <= 59, "Invalid timeframe");
        (
            uint256 year,
            uint256 month,
            uint256 day,
            uint256 hour,
            uint256 minute,
            uint256 second
        ) = DateTime.timestampToDateTime(block.timestamp);

        if (timeUnit == TimeUnit.MINUTE) {
            return
                DateTime.timestampFromDateTime(
                    year,
                    month,
                    day,
                    hour,
                    _getStartTime(minute, timeframe),
                    0
                );
        } else if (timeUnit == TimeUnit.SECOND) {
            return
                DateTime.timestampFromDateTime(
                    year,
                    month,
                    day,
                    hour,
                    minute,
                    _getStartTime(second, timeframe)
                );
        }

        return
            DateTime.timestampFromDateTime(
                year,
                month,
                day,
                hour,
                minute,
                second
            );
    }

    function _getStartTime(uint256 time, uint8 timeframe)
        private
        pure
        returns (uint256)
    {
        uint256 remainder = timeframe == 0 ? 0 : time % timeframe;
        uint256 startTime = remainder == 0 ? time : time - remainder;
        return startTime;
    }
}
