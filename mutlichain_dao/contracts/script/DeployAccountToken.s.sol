// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {AccountToken} from "../src/AccountToken.sol";
import {Account} from "../src/Account.sol";

contract DeployAccountModule is Script {
    function run() external returns (address) {
        address proxy = deploy();
        return proxy;
    } 
    function deploy() public returns (address) {
        vm.startBroadcast();
        AccountToken accountToken= new AccountToken();
        ERC1967Proxy proxy = new ERC1967Proxy(address(accountToken), "");
        AccountToken(address(proxy)).initialize();
        vm.stopBroadcast();
        return address(proxy);
    }
}