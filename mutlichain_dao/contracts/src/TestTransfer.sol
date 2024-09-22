// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

contract TransferTest {

    mapping (address=>uint256) balances;


    function deposit() external payable {
        balances[msg.sender] += msg.value; 
    }

    function withdraw() external {
        payable(msg.sender).transfer(balances[msg.sender]);
    }
}