// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

// Using a basic multi-sig for conceptual treasury
// For production, consider Gnosis Safe or a more robust audited multi-sig implementation
contract CreatorMultiSig is Ownable {
    uint256 public constant MIN_CONFIRMATIONS = 3; // Example: 3 out of N creators
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public numConfirmationsRequired;

    // Mapping from transaction ID to transaction details
    struct Transaction {
        address destination;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numConfirmations;
    }

    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmations; // txId => owner => confirmed
    uint256 public transactionCount;

    event Deposit(address indexed sender, uint256 amount);
    event Submission(uint256 indexed txId, address indexed destination, uint256 value, bytes data);
    event Confirmation(uint256 indexed txId, address indexed owner);
    event Execution(uint256 indexed txId, address indexed destination, uint256 value, bytes data);
    event Revocation(uint256 indexed txId, address indexed owner);

    constructor(address[] memory _owners, uint256 _numConfirmationsRequired) {
        require(_owners.length > 0, "Owners required");
        require(_numConfirmationsRequired > 0 && _numConfirmationsRequired <= _owners.length, "Invalid num confirmations");

        for (uint256 i = 0; i < _owners.length; i++) {
            require(_owners[i] != address(0), "Invalid owner");
            require(!isOwner[_owners[i]], "Owner not unique");
            owners.push(_owners[i]);
            isOwner[_owners[i]] = true;
        }
        numConfirmationsRequired = _numConfirmationsRequired;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    // Only owners can submit, confirm, revoke, execute
    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }

    function submitTransaction(address destination, uint256 value, bytes calldata data) external onlyOwner returns (uint256 txId) {
        txId = transactionCount;
        transactions[txId] = Transaction({
            destination: destination,
            value: value,
            data: data,
            executed: false,
            numConfirmations: 0
        });
        transactionCount++;
        emit Submission(txId, destination, value, data);
        return txId;
    }

    function confirmTransaction(uint256 txId) external onlyOwner {
        require(transactions[txId].destination != address(0), "Tx does not exist");
        require(!transactions[txId].executed, "Tx already executed");
        require(!confirmations[txId][msg.sender], "Tx already confirmed");

        confirmations[txId][msg.sender] = true;
        transactions[txId].numConfirmations++;
        emit Confirmation(txId, msg.sender);

        // Auto-execute if enough confirmations
        if (transactions[txId].numConfirmations >= numConfirmationsRequired) {
            executeTransaction(txId);
        }
    }

    function executeTransaction(uint256 txId) public onlyOwner {
        require(transactions[txId].destination != address(0), "Tx does not exist");
        require(!transactions[txId].executed, "Tx already executed");
        require(transactions[txId].numConfirmations >= numConfirmationsRequired, "Not enough confirmations");

        transactions[txId].executed = true;
        (bool success,) = transactions[txId].destination.call{value: transactions[txId].value}(transactions[txId].data);
        require(success, "Tx execution failed");

        emit Execution(txId, transactions[txId].destination, transactions[txId].value, transactions[txId].data);
    }

    function revokeConfirmation(uint256 txId) external onlyOwner {
        require(transactions[txId].destination != address(0), "Tx does not exist");
        require(!transactions[txId].executed, "Tx already executed");
        require(confirmations[txId][msg.sender], "Tx not confirmed");

        confirmations[txId][msg.sender] = false;
        transactions[txId].numConfirmations--;
        emit Revocation(txId, msg.sender);
    }

    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() external view returns (uint256) {
        return transactionCount;
    }

    function getTransaction(uint256 txId) external view returns (address destination, uint256 value, bytes memory data, bool executed, uint256 numConfirmations) {
        Transaction storage tx = transactions[txId];
        return (tx.destination, tx.value, tx.data, tx.executed, tx.numConfirmations);
    }

    function getConfirmationStatus(uint256 txId, address owner) external view returns (bool) {
        return confirmations[txId][owner];
    }
}
