// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.24;

import {IBalanceProvider} from "./IBalanceProvider.sol";

contract BalanceVoting {
    struct Proposal {
        string name;
        uint voteCount;
    }

    struct Voter {
        uint weight;
        bool voted;
        address delegate;
        uint vote;
    }

    mapping(address => Voter) public voters;

    uint public endTime;
    Proposal[] public proposals;
    IBalanceProvider private immutable balanceProvider;

    event Vote(address sender, uint8 to);
    event Delegate(address from, address to);

    constructor(
        uint _endTime,
        IBalanceProvider _balanceProvider,
        string[] memory _proposalNames
    ) {
        require(_proposalNames.length > 1, "Less than 2 proposal not allowed");

        endTime = _endTime;
        balanceProvider = _balanceProvider;

        for (uint i = 0; i < _proposalNames.length; i++) {
            proposals.push(Proposal({name: _proposalNames[i], voteCount: 0}));
        }
    }

    function getMyVote() public view returns (Voter memory voter) {
        return voters[msg.sender];
    }

    function vote(uint8 proposal) external {
        Voter storage sender = voters[msg.sender];
        sender.weight += balanceProvider.balanceOf(msg.sender);
        require(sender.weight != 0, "Has no right to vote");
        require(!sender.voted, "Already voted.");
        sender.voted = true;
        sender.vote = proposal;

        // If `proposal` is out of the range of the array,
        // this will throw automatically and revert all
        // changes.
        proposals[proposal].voteCount += sender.weight;

        emit Vote(msg.sender, proposal);
    }

    function delegate(address to) external {
        Voter storage sender = voters[msg.sender];
        sender.weight = balanceProvider.balanceOf(msg.sender);

        require(sender.weight != 0, "You have no right to vote");
        require(!sender.voted, "You already voted.");
        require(to != msg.sender, "Self-delegation is disallowed.");

        while (voters[to].delegate != address(0)) {
            to = voters[to].delegate;

            require(to != msg.sender, "Found loop in delegation.");
        }

        Voter storage delegate_ = voters[to];



        if (delegate_.voted) {
            proposals[delegate_.vote].voteCount += sender.weight;
        } else {
            
            require(balanceProvider.balanceOf(to) >= 1, "Delegator not allowed to vote");

            delegate_.weight += sender.weight;
            sender.voted = true;
            sender.delegate = to;
        }

        emit Delegate(msg.sender, to);
    }

    function winningProposal() public view returns ( uint winningProposal_ ){//TODO handle when proposal have equal vote
        require(block.timestamp >= endTime, "Voting is still running");

        uint winningVoteCount = 0;

        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }
}
