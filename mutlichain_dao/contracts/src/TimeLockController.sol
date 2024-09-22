// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract TimeLock is TimelockController {
    constructor(uint256 _minDelay, address[] memory _proposers, address[] memory _executors, address admin)
        TimelockController(_minDelay, _proposers, _executors, admin)
    {}
}