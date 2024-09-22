// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {ABUSD} from "../src/StableCoin.sol";
import {console} from "forge-std/console.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {abUSDManager} from "../src/StableCoinManager.sol";
import {DevOpsTools} from "lib/foundry-devops/src/DevOpsTools.sol";

contract DeployStableCoinManager is Script {
    function run() external returns (address) {
        address proxy = deploy();
        return proxy;
    } 
    address constant public myAddress = 0x5a381bDE1F3cB5eDDE26843c43eEc5B194F26F46 ;
    function deploy() public returns (address) {
        address[] memory tokens = new address[](1);
        tokens[0] = address(myAddress);
        address mostRecentlyDeployedTimeLock  = DevOpsTools.get_most_recent_deployment("TimeLock",block.chainid); 
        address mostRecentlyDeployedStableCoin = DevOpsTools.get_most_recent_deployment("ABUSD",block.chainid);
        vm.startBroadcast();
        abUSDManager manager = new abUSDManager();
        ERC1967Proxy proxy = new ERC1967Proxy(address(manager) , "");
        abUSDManager(address(proxy)).initialize(tokens, mostRecentlyDeployedStableCoin,mostRecentlyDeployedTimeLock);
        return address(proxy);
    }
}