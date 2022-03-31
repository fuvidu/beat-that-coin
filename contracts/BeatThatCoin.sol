//SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./utils/VotingSet.sol";
import "./utils/CandleTime.sol";

import "hardhat/console.sol";

contract BeatThatCoin is Pausable, Ownable, ReentrancyGuard {
    using VotingSet for VotingSet.Voting;

    CandleTime.TimeUnit public timeUnit;
    uint8 public timeframe;
    address public beneficiary;
    uint256 public costPerVote;
    uint8[] public prizeShares;
    mapping(address => uint256) private _balances;

    /**
     * @dev minute candleStartTime => VotingSet.Voting
     */
    mapping(uint256 => VotingSet.Voting) private _votingSet;

    constructor(
        address beneficiary_,
        uint256 costPerVote_,
        uint8[] memory prizeShares_,
        CandleTime.TimeUnit timeUnit_,
        uint8 timeframe_
    ) {
        _pause();
        setBeneficiary(beneficiary_);
        setCostPerVote(costPerVote_);
        setPrizeShares(prizeShares_);
        setTimeUnit(timeUnit_);
        setTimeframe(timeframe_);
        _unpause();
    }

    function releasePrizes(uint256 candleStartTime, uint8 winnerVote)
        external
        whenNotPaused
        onlyOwner
        nonReentrant
        validVote(winnerVote)
        returns (bool)
    {
        VotingSet.Voting storage voting = _votingSet[candleStartTime];
        require(voting.isPrizeReleased() == false, "Prizes already released");

        uint8 totalWinnerShares = 0;
        // TODO: replace fixed value with enum
        uint8 loserVote = winnerVote == 1 ? 2 : 1;
        uint256 loserCount = voting.getVoterCount(loserVote);
        uint256 winnerCount = voting.getVoterCount(winnerVote);
        uint256 totalPrizeAmount = costPerVote * loserCount;

        voting.setPrizeReleased(true);

        // transfer to winners
        if (totalPrizeAmount > 0) {
            for (uint8 i = 0; i < prizeShares.length; i++) {
                if (winnerCount <= i) {
                    break;
                }
                uint8 share = prizeShares[i];
                address winner = voting.getVoter(winnerVote, i);
                uint256 amount = (totalPrizeAmount * share) / 100;
                _balances[winner] += amount;
                totalWinnerShares += share;
            }
        }

        // transfer remaining amount to beneficiary
        if (totalWinnerShares < 100 && totalPrizeAmount > 0) {
            _balances[beneficiary] +=
                (totalPrizeAmount * (100 - totalWinnerShares)) /
                100;
        }

        // deduct from loser
        if (loserCount > 0) {
            for (uint256 i = 0; i < loserCount; i++) {
                address loser = voting.getVoter(loserVote, i);
                if (_balances[loser] >= costPerVote) {
                    _balances[loser] -= costPerVote;
                } else {
                    // TODO: does this case ever happen?
                    _balances[loser] = 0;
                }
            }
        }

        return true;
    }

    function setVoting(uint8 vote)
        external
        payable
        whenNotPaused
        validVote(vote)
        returns (bool)
    {
        require(msg.value == costPerVote, "Cost does not match");
        uint256 candleStartTime = CandleTime.getCandleStartTime(
            timeUnit,
            timeframe
        );

        _votingSet[candleStartTime].setVoting(msg.sender, vote);
        _balances[msg.sender] += msg.value;
        return true;
    }

    function getTotalFunds() public view returns (uint256) {
        return address(this).balance;
    }

    function balanceOf(address owner) public view returns (uint256) {
        return _balances[owner];
    }

    function withdraw() external whenNotPaused nonReentrant returns (bool) {
        require(
            _balances[msg.sender] > 0 &&
                getTotalFunds() >= _balances[msg.sender],
            "Insufficient funds"
        );
        (bool successful, ) = payable(msg.sender).call{
            value: _balances[msg.sender]
        }("");
        require(successful, "Failed to widthraw");
        return true;
    }

    function getTotalVotes(uint256 candleStartTime)
        public
        view
        returns (uint256)
    {
        return _votingSet[candleStartTime].getTotalVotes();
    }

    function getVote(uint256 candleStartTime, address voter)
        public
        view
        returns (uint8)
    {
        return _votingSet[candleStartTime].getVote(voter);
    }

    modifier validVote(uint8 upOrDown) {
        require(upOrDown == 1 || upOrDown == 2, "Possible values: 1 or 2");
        _;
    }

    function setTimeUnit(CandleTime.TimeUnit timeUnit_)
        public
        whenPaused
        onlyOwner
    {
        timeUnit = timeUnit_;
    }

    function setTimeframe(uint8 timeframe_) public whenPaused onlyOwner {
        require(timeframe <= 59, "Timeframe must be from 1-59");
        timeframe = timeframe_;
    }

    function setBeneficiary(address beneficiary_) public onlyOwner {
        require(beneficiary_ != address(0), "Invalid address");
        beneficiary = beneficiary_;
    }

    function setCostPerVote(uint256 costPerVote_) public whenPaused onlyOwner {
        costPerVote = costPerVote_;
    }

    function setPrizeShares(uint8[] memory prizeShares_)
        public
        whenPaused
        onlyOwner
    {
        uint8 totalShares = 0;
        for (uint8 i = 0; i < prizeShares_.length; i++) {
            totalShares += prizeShares_[i];
        }
        require(totalShares <= 100, "Invalid shares");
        prizeShares = prizeShares_;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
}
