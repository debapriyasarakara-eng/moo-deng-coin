// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol";

contract MooDengCoin is ERC20 {
    constructor() ERC20("Moo Deng Coin", "MDC") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}
