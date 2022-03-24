//SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @dev Library for managing votes and voters.
 */

library VotingSet {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Voting {
        mapping(uint8 => EnumerableSet.AddressSet) _voters;
        mapping(address => uint8) _votes;
        uint256 _voteCount;
        bool _isPrizeReleased;
    }

    function setVoting(
        Voting storage voting,
        address voter,
        uint8 vote
    ) internal returns (bool) {
        // To simplify, we only allow voter to vote once
        // if we support for re-vote then we need to remove the voter out of _upVoters and _downVoters
        // and then add him to the end
        require(voting._votes[voter] == 0, "Already voted");
        voting._votes[voter] = vote;
        voting._voteCount += 1;

        return voting._voters[vote].add(voter);
    }

    function setPrizeReleased(Voting storage voting, bool released) internal {
        voting._isPrizeReleased = released;
    }

    function getVoter(
        Voting storage voting,
        uint8 vote,
        uint256 index
    ) internal view returns (address) {
        return voting._voters[vote].at(index);
    }

    function getVote(Voting storage voting, address voter)
        internal
        view
        returns (uint8)
    {
        return voting._votes[voter];
    }

    function getTotalVotes(Voting storage voting)
        internal
        view
        returns (uint256)
    {
        return voting._voteCount;
    }

    // we do not return the voter array because it is not gas efficient
    function getVoterCount(Voting storage voting, uint8 vote)
        internal
        view
        returns (uint256)
    {
        return voting._voters[vote].length();
    }

    function isPrizeReleased(Voting storage voting)
        internal
        view
        returns (bool)
    {
        return voting._isPrizeReleased;
    }
}
