// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {veUAB} from "../src/GovToken.sol";
import {console} from "forge-std/console.sol";
import {UAbyssGovernor} from "../src/Governor.sol";
import {TimeLock} from "../src/TimeLockController.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";


contract DeployGov is Script {
    address me =  0x67ff09c184d8e9e7B90C5187ED04cbFbDba741C8;
    function run() external returns (address token,address gov,address timelock) {
        address[] memory proposers = new address[](1);
        proposers[0] = me;
        address[] memory executors = new address[](1);
        executors[0] =me;
        vm.startBroadcast();
        TimeLock timeLock = new TimeLock(3600,proposers,executors, me);
        timelock = address(timeLock);
        veUAB veuab = new veUAB(timelock);
        token = address(veuab);
        veuab.mint(me,100);
        UAbyssGovernor governor = new UAbyssGovernor(IVotes(veuab),timeLock);
        gov = address(governor);
        vm.stopBroadcast(); 
    } 
}