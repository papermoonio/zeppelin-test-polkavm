// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC1155} from "./token/ERC1155/ERC1155.sol";
import {ERC1155URIStorage} from "./token/ERC1155/extensions/ERC1155URIStorage.sol";
import {Ownable} from "./access/Ownable.sol";

contract PVMERC1155URIStorage is ERC1155URIStorage, Ownable {
    mapping(uint256 => uint256) private _totalSupply;

    constructor(
        string memory uri_
    ) ERC1155URIStorage() ERC1155(uri_) Ownable(msg.sender) {}

    function mint(
        address to,
        uint256 id,
        uint256 value,
        bytes memory data
    ) public onlyOwner {
        require(to != address(0), "ERC1155: mint to the zero address");
        _mint(to, id, value, data);
        _totalSupply[id] += value;
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory values,
        bytes memory data
    ) public onlyOwner {
        require(to != address(0), "ERC1155: mint to the zero address");
        require(
            ids.length == values.length,
            "ERC1155: ids and values length mismatch"
        );

        _mintBatch(to, ids, values, data);

        for (uint256 i = 0; i < ids.length; i++) {
            _totalSupply[ids[i]] += values[i];
        }
    }

    function burn(address from, uint256 id, uint256 value) public onlyOwner {
        require(from != address(0), "ERC1155: burn from the zero address");
        require(
            balanceOf(from, id) >= value,
            "ERC1155: burn amount exceeds balance"
        );

        _burn(from, id, value);
        _totalSupply[id] -= value;
    }

    function burnBatch(
        address from,
        uint256[] memory ids,
        uint256[] memory values
    ) public onlyOwner {
        require(from != address(0), "ERC1155: burn from the zero address");
        require(
            ids.length == values.length,
            "ERC1155: ids and values length mismatch"
        );

        for (uint256 i = 0; i < ids.length; i++) {
            require(
                balanceOf(from, ids[i]) >= values[i],
                "ERC1155: burn amount exceeds balance"
            );
        }

        _burnBatch(from, ids, values);

        for (uint256 i = 0; i < ids.length; i++) {
            _totalSupply[ids[i]] -= values[i];
        }
    }

    function setURI(uint256 tokenId, string memory tokenURI) public onlyOwner {
        _setURI(tokenId, tokenURI);
    }

    function setBaseURI(string memory baseURI) public onlyOwner {
        _setBaseURI(baseURI);
    }

    function totalSupply(uint256 id) public view returns (uint256) {
        return _totalSupply[id];
    }

    function exists(uint256 id) public view returns (bool) {
        return _totalSupply[id] > 0;
    }
}
