// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.26;


import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {IAccountToken} from "./interfaces/IAccountToken.sol";
import {SafeCast} from  "@openzeppelin/contracts/utils/math/SafeCast.sol";


contract AccountToken is Initializable,ContextUpgradeable,OwnableUpgradeable,ERC721EnumerableUpgradeable,IAccountToken,UUPSUpgradeable{

    using SafeCast for uint256;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init(_msgSender());
        __UUPSUpgradeable_init();
        __ERC721_init("AccountToken", "AT");
    }

     function isInitialized() external view returns (bool) {
    }

    function mintNft(address user,uint128 to) external override{
        _safeMint(user, to);
    }

    function _authorizeUpgrade(address newImplementation) internal view override onlyOwner {}
}