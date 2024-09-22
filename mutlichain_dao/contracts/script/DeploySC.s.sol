// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {ABUSD} from "../src/StableCoin.sol";
import {console} from "forge-std/console.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {abUSDManager} from "../src/StableCoinManager.sol";
import {DevOpsTools} from "lib/foundry-devops/src/DevOpsTools.sol";

contract DeploySC is Script {

    function run()
        external
        returns (address stableCoin, address stableCoinManager)
    {
        vm.startBroadcast();
        ABUSD abusd = new ABUSD();
        stableCoin= address(abusd);
        abUSDManager manager = new abUSDManager(address(abusd));
        abusd.transferOwnership(address(manager));
        stableCoinManager = address(manager);
        vm.stopBroadcast();
    }
}
