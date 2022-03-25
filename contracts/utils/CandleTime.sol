//SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@quant-finance/solidity-datetime/contracts/DateTime.sol";

/**
 * @dev Library for utility functions to work with candle time
 */
library CandleTime {
    /**
     * @dev The possible values of the time unit.
     * Usually we use minute unit but for testing purpose we may use second unit
     */
    enum TimeUnit {
        NONE,
        SECOND,
        MINUTE
    }

    /**
     * @dev Returns start time of one candle stick for current block timestamp
     * @param timeUnit The unit of the time ie minute or second
     * @param timeframe The timeframe ie time interval of the candle sticks, for example 1 minute, 5 minutes etc
     * @return Start time of the candle stick in timestamp
     */
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
            minute = _getStartTimeframe(minute, timeframe);
            second = 0;
        } else if (timeUnit == TimeUnit.SECOND) {
            second = _getStartTimeframe(second, timeframe);
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

    /**
     * @dev Returns the start of a timeframe.
     * For example if the timeframe is 15 and the minute is 20 then the start time of the timeframe is 15
     * @param time The current time of the timeframe
     * @param timeframe The time frame value ie 1 minute, 5 minutes etc
     */
    function _getStartTimeframe(uint256 time, uint8 timeframe)
        private
        pure
        returns (uint256)
    {
        uint256 remainder = timeframe == 0 ? 0 : time % timeframe;
        uint256 startTime = remainder == 0 ? time : time - remainder;
        return startTime;
    }
}
