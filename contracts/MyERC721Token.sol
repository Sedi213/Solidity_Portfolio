// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.24;

import  "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MyERC721Token is ERC721URIStorage {
    uint256 private _nextTokenId;
    address public owner;

    error NotOwner();

    constructor() ERC721("My NFT","MYNFT"){
        owner = msg.sender;
    }

    modifier onlyOwner {
        if(msg.sender != owner){
           revert NotOwner();
        }
        _;
    }

    function mint(address to, string memory tokenURI) public onlyOwner returns(uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        return tokenId;
    }

    function burn(uint256 tokenId) public onlyOwner{
        address ownerToken = _ownerOf(tokenId);
        _update(address(0), tokenId, ownerToken);
    }
}