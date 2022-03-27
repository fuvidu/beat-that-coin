//SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../../utils/VotingSet.sol";

contract VotingSetMock {
    using VotingSet for VotingSet.Voting;

    VotingSet.Voting private _voting;

    function setVoting(address voter, uint8 vote) public {
        _voting.setVoting(voter, vote);
    }

    function setPrizeReleased(bool released) public {
        _voting.setPrizeReleased(released);
    }

    function getVoterCount(uint8 vote) public view returns (uint256) {
        return _voting.getVoterCount(vote);
    }

    function getVoter(uint8 vote, uint256 index) public view returns (address) {
        return _voting.getVoter(vote, index);
    }

    function getVote(address voter) public view returns (uint8) {
        return _voting.getVote(voter);
    }

    function getTotalVotes() public view returns (uint256) {
        return _voting.getTotalVotes();
    }

    function isPrizeReleased() public view returns (bool) {
        return _voting.isPrizeReleased();
    }
}
