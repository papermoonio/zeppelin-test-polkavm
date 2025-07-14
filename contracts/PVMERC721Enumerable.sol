// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "./token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "./token/ERC721/extensions/ERC721Enumerable.sol";
import {Ownable} from "./access/Ownable.sol";

contract PVMERC721Enumerable is ERC721Enumerable, Ownable {
    uint256 private _currentTokenId;
    string private _baseTokenURI;

    constructor(
        string memory name_,
        string memory symbol_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        _currentTokenId = 1; // Start token IDs from 1
    }

    /**
     * @dev Mint a token to the specified address
     * @param to The address to mint the token to
     */
    function mint(address to) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");

        _safeMint(to, _currentTokenId);
        _currentTokenId++;
    }

    /**
     * @dev Mint multiple tokens to the specified address
     * @param to The address to mint tokens to
     * @param quantity The number of tokens to mint
     */
    function mintBatch(address to, uint256 quantity) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(quantity > 0, "Quantity must be greater than 0");
        require(quantity <= 100, "Cannot mint more than 100 tokens at once");

        for (uint256 i = 0; i < quantity; i++) {
            _safeMint(to, _currentTokenId);
            _currentTokenId++;
        }
    }

    /**
     * @dev Burn a token
     * @param tokenId The token ID to burn
     */
    function burn(uint256 tokenId) public {
        require(
            _isAuthorized(_ownerOf(tokenId), msg.sender, tokenId),
            "Not authorized to burn"
        );
        _burn(tokenId);
    }

    /**
     * @dev Set the base URI for token metadata
     * @param baseURI The base URI
     */
    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }

    /**
     * @dev Get the base URI for token metadata
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Get the next token ID that will be minted
     */
    function nextTokenId() public view returns (uint256) {
        return _currentTokenId;
    }

    /**
     * @dev Get all token IDs owned by an address
     * @param owner The address to query
     */
    function tokensOfOwner(
        address owner
    ) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);

        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }

        return tokenIds;
    }

    /**
     * @dev Check if a token exists
     * @param tokenId The token ID to check
     */
    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
