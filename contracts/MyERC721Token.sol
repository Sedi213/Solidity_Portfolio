// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.24;

import  "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MyERC721Token is ERC721URIStorage {
    uint256 private _nextTokenId;
    address public owner;

    constructor() ERC721("My NFT","MYNFT"){
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender != owner);
        _;
    }

    function mint(address to, string memory tokenURI) public onlyOwner returns(uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        return tokenId;
    }

    function burn(uint256 tokenId) public onlyOwner{
        _update(address(0), tokenId, address(0));
    }
}