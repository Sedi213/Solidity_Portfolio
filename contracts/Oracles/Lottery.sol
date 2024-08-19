// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.26;

import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

//each interval start
contract Lottery is VRFConsumerBaseV2Plus, AutomationCompatibleInterface {
    enum LotteryState {
        OPEN,
        PENDING
    }
    uint32 constant CALLBACK_GAS_LIMIT = 500000;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    uint256 public immutable interval;
    uint256 public immutable weiToParticipate;
    uint256 public immutable weiFee;
    uint256 public roundBalance;
    bytes32 public immutable keyHash;
    uint256 public immutable subscriptionId;

    uint256 public lastTimeStamp;
    LotteryState public lotteryState;
    address[] public players;

    error NotSatisfyCondition();
    error IncorrectLotteryState();
    error IncorrectAmount(uint256 provided, uint256 needed);

    event LotteryJoined(address indexed player);
    event LotteryWinnerPicked(
        address indexed winner,
        uint256 indexed randomWord
    );

    constructor(
        uint256 _interval,
        uint256 _weiToParticipate,
        uint256 _weiFee,
        address vrfCoordinator,
        bytes32 _keyHash,
        uint256 _subscriptionId
    ) VRFConsumerBaseV2Plus(vrfCoordinator) {
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;
        interval = _interval;
        weiToParticipate = _weiToParticipate;
        weiFee = _weiFee;
        lastTimeStamp = block.timestamp;
    }

    function performUpkeep(bytes calldata /* performData */) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        require(upkeepNeeded, NotSatisfyCondition());

        lotteryState = LotteryState.PENDING;
        uint256 requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: subscriptionId,
                requestConfirmations: REQUEST_CONFIRMATIONS,
                callbackGasLimit: CALLBACK_GAS_LIMIT,
                numWords: NUM_WORDS,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );
    }

    //The checkData is defined when the Upkeep was registered.
    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory /* performData */)
    {
        bool lotteryOpen = lotteryState == LotteryState.OPEN;
        bool timePassed = (block.timestamp - lastTimeStamp) >= interval;
        bool hasPlayers = players.length != 0;

        upkeepNeeded = lotteryOpen && timePassed && hasPlayers;
    }

    //more time player join more chance to win
    function join() public payable {
        require(
            msg.value == weiToParticipate,
            IncorrectAmount(msg.value, weiToParticipate)
        );
        require(lotteryState == LotteryState.OPEN, IncorrectLotteryState());

        roundBalance += weiToParticipate - weiFee;
        players.push(msg.sender);
        emit LotteryJoined(msg.sender);
    }

    function fulfillRandomWords(
        uint256 /*requestId*/,
        uint256[] calldata randomWords
    ) internal override {
        uint256 winnerIndex = randomWords[0] % players.length;
        address payable winner = payable(players[winnerIndex]);
        lotteryState = LotteryState.OPEN;
        lastTimeStamp = block.timestamp;

        delete players; //the same as players.length = 0

        (bool success, bytes memory data) = winner.call{value: roundBalance}(
            ""
        );

        if (!success) {
            assembly {
                let revertStringLength := mload(data)
                let revertStringPtr := add(data, 0x20)
                revert(revertStringPtr, revertStringLength)
            }
        }

        roundBalance = 0;

        emit LotteryWinnerPicked(winner, randomWords[0]);
    }
}
