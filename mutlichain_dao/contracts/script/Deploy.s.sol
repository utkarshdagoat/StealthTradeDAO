// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import { Script } from "forge-std/Script.sol";
import {Counter} from  "../src/Counter.sol";

contract Deploy is Script {

    function run() external returns (address) {
        vm.startBroadcast();
        Counter test = new Counter();
        vm.stopBroadcast();
        return address(test);
    }
}