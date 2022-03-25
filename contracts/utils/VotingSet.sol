//SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @dev Library for managing votes and voters.
 */
library VotingSet {
    using EnumerableSet for EnumerableSet.AddressSet;

    /**
     * @dev A voting record
     */
    struct Voting {
        // Contains a set of voters categoried by vote value ie Up/Down => AddressSet
        mapping(uint8 => EnumerableSet.AddressSet) _voters;
        // Contains votes by users
        mapping(address => uint8) _votes;
        // Total votes
        uint256 _voteCount;
        // Whether the prizes of the voting record heas been released
        bool _isPrizeReleased;
    }

    /**
     * @dev Set a voting record. Returns
     * To simplify, we only allow voter to vote once, otherwise if we allow users to re-vote then we need to remove
     * the voter out of _voters and then add him/her to the end.
     * @param voting The voting record
     * @param voter The address of the voter
     * @param vote The vote value ie Up or Down
     */
    function setVoting(
        Voting storage voting,
        address voter,
        uint8 vote
    ) internal {
        require(voting._votes[voter] == 0, "Already voted");
        voting._votes[voter] = vote;
        voting._voteCount += 1;
        voting._voters[vote].add(voter);
    }

    /**
     * @dev Set whether the prizes of one voting record are released or not.
     * @param voting The voting record
     * @param released Whether the prizes are released
     */
    function setPrizeReleased(Voting storage voting, bool released) internal {
        voting._isPrizeReleased = released;
    }

    // we do not return the voter array because it is not gas efficient
    function getVoterCount(Voting storage voting, uint8 vote)
        internal
        view
        returns (uint256)
    {
        return voting._voters[vote].length();
    }

    /**
     * @dev Returns the voter address by vote value at an index of the voters set
     * In order to save the gas fee, we do not returns the whole voters set. We instead returns the voter count and
     * then use a loop to get the voters by index.
     * @param vote The vote value ie Up or Down
     * @param index The index of the voters set
     * @return Address of the voter
     */
    function getVoter(
        Voting storage voting,
        uint8 vote,
        uint256 index
    ) internal view returns (address) {
        return voting._voters[vote].at(index);
    }

    /**
     * @dev Returns the vote value ie Up or Down of one voter
     * @param voting The voting record
     * @param voter The address of the voter
     * @return The vote value
     */
    function getVote(Voting storage voting, address voter)
        internal
        view
        returns (uint8)
    {
        return voting._votes[voter];
    }

    /**
     * @dev Returns the total votes
     * @param voting The voting record
     * @return The total votes
     */
    function getTotalVotes(Voting storage voting)
        internal
        view
        returns (uint256)
    {
        return voting._voteCount;
    }

    /**
     * @dev Returns if the prizes of one voting record has been released
     * @param voting The voting record
     * @return Released or not
     */
    function isPrizeReleased(Voting storage voting)
        internal
        view
        returns (bool)
    {
        return voting._isPrizeReleased;
    }
}
