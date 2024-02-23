// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

contract TopicTrade is OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using AddressUpgradeable for address payable;

    uint256 private constant BASE_DIVIDER = 16000;
    uint256 private constant ACC_FEE_PRECISION = 1e4;

    address payable public protocolFeeDestination;
    uint256 public protocolFeePercent;
    uint256 public holderFeePercent;

    struct Topic {
        uint256 supply;
        uint256 accFeePerUnit;
    }

    struct Holder {
        uint256 balance;
        int256 feeDebt;
    }

    mapping(bytes32 => Topic) public topics;
    mapping(bytes32 => mapping(address => Holder)) public holders;

    event SetProtocolFeeDestination(address indexed destination);
    event SetProtocolFeePercent(uint256 percent);
    event SetHolderFeePercent(uint256 percent);

    event Trade(
        address indexed trader,
        bytes32 indexed topic,
        bool indexed isBuy,
        uint256 amount,
        uint256 price,
        uint256 protocolFee,
        uint256 holderFee,
        uint256 supply
    );

    event ClaimHolderFee(
        address indexed holder,
        bytes32 indexed topic,
        uint256 fee
    );

    function initialize(
        address payable _protocolFeeDestination,
        uint256 _protocolFeePercent,
        uint256 _holderFeePercent
    ) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();

        protocolFeeDestination = _protocolFeeDestination;
        protocolFeePercent = _protocolFeePercent;
        holderFeePercent = _holderFeePercent;

        emit SetProtocolFeeDestination(_protocolFeeDestination);
        emit SetProtocolFeePercent(_protocolFeePercent);
        emit SetHolderFeePercent(_holderFeePercent);
    }

    function setProtocolFeeDestination(
        address payable _feeDestination
    ) external onlyOwner {
        protocolFeeDestination = _feeDestination;
        emit SetProtocolFeeDestination(_feeDestination);
    }

    function setProtocolFeePercent(uint256 _feePercent) external onlyOwner {
        protocolFeePercent = _feePercent;
        emit SetProtocolFeePercent(_feePercent);
    }

    function setHolderFeePercent(uint256 _feePercent) external onlyOwner {
        holderFeePercent = _feePercent;
        emit SetHolderFeePercent(_feePercent);
    }

    function getPrice(
        uint256 supply,
        uint256 amount
    ) public pure returns (uint256) {
        uint256 sum1 = ((supply * (supply + 1)) * (2 * supply + 1)) / 6;
        uint256 sum2 = (((supply + amount) * (supply + 1 + amount)) *
            (2 * (supply + amount) + 1)) / 6;
        uint256 summation = sum2 - sum1;
        return (summation * 1 ether) / BASE_DIVIDER;
    }

    function getBuyPrice(
        bytes32 topic,
        uint256 amount
    ) public view returns (uint256) {
        return getPrice(topics[topic].supply, amount);
    }

    function getSellPrice(
        bytes32 topic,
        uint256 amount
    ) public view returns (uint256) {
        return getPrice(topics[topic].supply - amount, amount);
    }

    function getBuyPriceAfterFee(
        bytes32 topic,
        uint256 amount
    ) external view returns (uint256) {
        uint256 price = getBuyPrice(topic, amount);
        uint256 protocolFee = (price * protocolFeePercent) / 1 ether;
        uint256 holderFee = (price * holderFeePercent) / 1 ether;
        return price + protocolFee + holderFee;
    }

    function getSellPriceAfterFee(
        bytes32 topic,
        uint256 amount
    ) external view returns (uint256) {
        uint256 price = getSellPrice(topic, amount);
        uint256 protocolFee = (price * protocolFeePercent) / 1 ether;
        uint256 holderFee = (price * holderFeePercent) / 1 ether;
        return price - protocolFee - holderFee;
    }

    function buyTopic(
        bytes32 topic,
        uint256 amount
    ) external payable nonReentrant {
        uint256 price = getBuyPrice(topic, amount);
        uint256 protocolFee = (price * protocolFeePercent) / 1 ether;
        uint256 holderFee = (price * holderFeePercent) / 1 ether;

        require(
            msg.value >= price + protocolFee + holderFee,
            "TopicTrade: insufficient payment"
        );

        Topic memory t = topics[topic];
        Holder storage holder = holders[topic][msg.sender];

        holder.balance += amount;
        holder.feeDebt += int256(
            (amount * t.accFeePerUnit) / ACC_FEE_PRECISION
        );

        t.supply += amount;
        t.accFeePerUnit += (holderFee * ACC_FEE_PRECISION) / t.supply;
        topics[topic] = t;

        protocolFeeDestination.sendValue(protocolFee);
        if (msg.value > price + protocolFee + holderFee) {
            uint256 refund = msg.value - price - protocolFee - holderFee;
            payable(msg.sender).sendValue(refund);
        }

        emit Trade(
            msg.sender,
            topic,
            true,
            amount,
            price,
            protocolFee,
            holderFee,
            t.supply
        );
    }

    function sellTopic(bytes32 topic, uint256 amount) external nonReentrant {
        uint256 price = getSellPrice(topic, amount);
        uint256 protocolFee = (price * protocolFeePercent) / 1 ether;
        uint256 holderFee = (price * holderFeePercent) / 1 ether;

        Topic memory t = topics[topic];
        Holder storage holder = holders[topic][msg.sender];

        t.accFeePerUnit += (holderFee * ACC_FEE_PRECISION) / t.supply;
        t.supply -= amount;
        topics[topic] = t;

        require(holder.balance >= amount, "TopicTrade: insufficient balance");
        holder.balance -= amount;
        holder.feeDebt -= int256(
            (amount * t.accFeePerUnit) / ACC_FEE_PRECISION
        );

        uint256 netAmount = price - protocolFee - holderFee;
        payable(msg.sender).sendValue(netAmount);
        protocolFeeDestination.sendValue(protocolFee);

        emit Trade(
            msg.sender,
            topic,
            false,
            amount,
            price,
            protocolFee,
            holderFee,
            t.supply
        );
    }

    function claimableHolderFee(
        bytes32 topic,
        address holder
    ) external view returns (uint256 claimableFee) {
        Topic memory t = topics[topic];
        Holder memory h = holders[topic][holder];

        int256 accumulatedFee = int256(
            (h.balance * t.accFeePerUnit) / ACC_FEE_PRECISION
        );
        claimableFee = uint256(accumulatedFee - h.feeDebt);
    }

    function claimHolderFee(bytes32 topic) external nonReentrant {
        Topic memory t = topics[topic];
        Holder storage holder = holders[topic][msg.sender];

        int256 accumulatedFee = int256(
            (holder.balance * t.accFeePerUnit) / ACC_FEE_PRECISION
        );
        uint256 claimableFee = uint256(accumulatedFee - holder.feeDebt);

        holder.feeDebt = accumulatedFee;

        payable(msg.sender).sendValue(claimableFee);

        emit ClaimHolderFee(msg.sender, topic, claimableFee);
    }
}
