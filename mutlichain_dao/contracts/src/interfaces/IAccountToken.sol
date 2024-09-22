//SPDX-License-Identifier: MIT
pragma solidity >=0.8.11 <0.9.0;


import {IERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";

interface IAccountToken is IERC721Enumerable {
 function mintNft(address user,uint128 to) external;
}