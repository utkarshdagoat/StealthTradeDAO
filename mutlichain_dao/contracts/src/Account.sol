// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.26;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IAccountToken} from "./interfaces/IAccountToken.sol";

contract Account is
    Initializable,
    ContextUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    IAccountToken accountToken;
    uint128 accountIdOffset;

    event AccountCreated(
        address indexed accountOwner,
        uint128 indexed accountId
    );

    function initialize(address _token) public initializer {
        __Ownable_init(_msgSender());
        __UUPSUpgradeable_init();
        accountToken = IAccountToken(_token);
        accountIdOffset = 1;
    }

    function createAccount() external returns (uint128 accountId) {
        accountId = (type(uint128).max / 2) + accountIdOffset;
        accountIdOffset += 1;
        accountToken.mintNft(_msgSender(), accountId);
        emit AccountCreated(_msgSender(), accountId);
    }

    function getAccountOwner(uint128 accountId) public view returns (address) {
        return accountToken.ownerOf(accountId);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal view override onlyOwner {}
}
