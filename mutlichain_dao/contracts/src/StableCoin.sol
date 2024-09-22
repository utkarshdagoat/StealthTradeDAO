// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.26;


import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {SafeCast} from  "@openzeppelin/contracts/utils/math/SafeCast.sol";

import {ERC20BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";


contract ABUSD is Initializable,ContextUpgradeable,OwnableUpgradeable,UUPSUpgradeable,ERC20BurnableUpgradeable{

    using SafeCast for uint256;
    error StableCoin__AmountMustBeMoreThanZero();
    error StableCoin__BurnAmountExceedsBalance();
    error StableCoin__NotZeroAddress();
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        __ERC20_init("Abyss USD", "abUSD");
    }

     function isInitialized() external view returns (bool) {
    }


    function burn(uint256 _amount) public override onlyOwner {
        uint256 balance = balanceOf(msg.sender);
        if (_amount <= 0) {
            revert StableCoin__AmountMustBeMoreThanZero();
        }
        if (balance < _amount) {
            revert StableCoin__BurnAmountExceedsBalance();
        }
        super.burn(_amount);
    }

    function mint(address _to, uint256 _amount) external onlyOwner returns (bool) {
        if (_to == address(0)) {
            revert StableCoin__NotZeroAddress();
        }
        if (_amount <= 0) {
            revert StableCoin__AmountMustBeMoreThanZero();
        }
        _mint(_to, _amount);
        return true;
    }

    function balanceOfUser(address account) external view returns (uint256) {
        return balanceOf(account);
    }

    function _authorizeUpgrade(address newImplementation) internal view override onlyOwner {}
}