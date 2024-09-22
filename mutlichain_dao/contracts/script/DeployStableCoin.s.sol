// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {ABUSD} from "../src/StableCoin.sol";
import {console} from "forge-std/console.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployStableCoin is Script {
    function run() external returns (address) {
        address proxy = deploy();
        return proxy;
    } 
    function deploy() public returns (address) {
        vm.startBroadcast();
        ABUSD abusd= new ABUSD();
        ERC1967Proxy proxy = new ERC1967Proxy(address(abusd), "");
        // ABUSD(address(proxy)).initialize();
        vm.stopBroadcast();
        return address(proxy);
    }
}