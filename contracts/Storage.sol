pragma solidity ^0.8.19;

contract Storage {
    string public number;
    constructor(string memory num) {
        number = num;
    }

    /**
     * @dev Store value in variable
     * @param num value to store
     */
    function store(string memory num) public {
        number = num;
    }

    /**
     * @dev Return value
     * @return value of 'number'
     */
    function retrieve() public view returns (string memory) {
        return number;
    }
}