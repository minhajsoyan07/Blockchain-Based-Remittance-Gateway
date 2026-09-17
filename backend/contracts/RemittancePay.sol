pragma solidity ^0.8.0;

contract RemittancePay {
    struct Transaction {
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        string status;
        uint256 gasUsed;
    }

    struct UserProfile {
        address walletAddress;
        string name;
        string email;
        string phone;
        string nationality;
        uint256 age;
        string gender;
        string nidNumber;
        string address_;
        bool verified;
        uint256 createdAt;
    }

    mapping(address => UserProfile) public profiles;
    mapping(address => Transaction[]) public transactionHistory;
    mapping(address => uint256) public balances;
    mapping(address => bool) public registeredUsers;

    event TransactionSent(address indexed from, address indexed to, uint256 amount, uint256 timestamp);
    event TransactionReceived(address indexed to, address indexed from, uint256 amount, uint256 timestamp);
    event ProfileCreated(address indexed user, string name);
    event BalanceUpdated(address indexed user, uint256 newBalance);
    event FundsWithdrawn(address indexed user, uint256 amount);

    // Send money to another address
    function sendMoney(address _to, uint256 _amount) public payable returns (bool) {
        require(_to != address(0), "Invalid recipient address");
        require(_amount > 0, "Amount must be greater than 0");
        require(msg.value >= _amount, "Insufficient balance");
        require(registeredUsers[msg.sender], "Sender not registered");

        balances[msg.sender] -= _amount;
        balances[_to] += _amount;

        Transaction memory txn = Transaction({
            from: msg.sender,
            to: _to,
            amount: _amount,
            timestamp: block.timestamp,
            status: "completed",
            gasUsed: tx.gasprice * 21000
        });

        transactionHistory[msg.sender].push(txn);
        transactionHistory[_to].push(txn);

        emit TransactionSent(msg.sender, _to, _amount, block.timestamp);
        emit TransactionReceived(_to, msg.sender, _amount, block.timestamp);

        return true;
    }

    // Receive money (called by sender)
    function receiveMoney(address _from, uint256 _amount) public returns (bool) {
        require(_from != address(0), "Invalid sender address");
        require(_amount > 0, "Amount must be greater than 0");
        require(registeredUsers[msg.sender], "Receiver not registered");

        balances[msg.sender] += _amount;

        emit BalanceUpdated(msg.sender, balances[msg.sender]);
        return true;
    }

    // Create or update user profile
    function createProfile(
        string memory _name,
        string memory _email,
        string memory _phone,
        string memory _nationality,
        uint256 _age,
        string memory _gender,
        string memory _nidNumber,
        string memory _address
    ) public {
        profiles[msg.sender] = UserProfile({
            walletAddress: msg.sender,
            name: _name,
            email: _email,
            phone: _phone,
            nationality: _nationality,
            age: _age,
            gender: _gender,
            nidNumber: _nidNumber,
            address_: _address,
            verified: false,
            createdAt: block.timestamp
        });

        registeredUsers[msg.sender] = true;
        emit ProfileCreated(msg.sender, _name);
    }

    // Get user profile
    function getProfile(address _user) public view returns (UserProfile memory) {
        return profiles[_user];
    }

    // Get user balance
    function getBalance(address _user) public view returns (uint256) {
        return balances[_user];
    }

    // Get transaction history
    function getTransactionHistory(address _user) public view returns (Transaction[] memory) {
        return transactionHistory[_user];
    }

    // Add funds to account
    function addFunds() public payable {
        require(msg.value > 0, "Amount must be greater than 0");
        require(registeredUsers[msg.sender], "User not registered");

        balances[msg.sender] += msg.value;
        emit BalanceUpdated(msg.sender, balances[msg.sender]);
    }

    // Verify user profile
    function verifyProfile(address _user) public {
        require(profiles[_user].walletAddress != address(0), "Profile does not exist");
        profiles[_user].verified = true;
    }

    // Withdraw funds from account
    function withdrawFunds(uint256 _amount) public {
        require(registeredUsers[msg.sender], "User not registered");
        require(_amount > 0, "Amount must be greater than 0");
        require(balances[msg.sender] >= _amount, "Insufficient balance");

        balances[msg.sender] -= _amount;
        
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(msg.sender, _amount);
        emit BalanceUpdated(msg.sender, balances[msg.sender]);
    }

    // Get transaction count
    function getTransactionCount(address _user) public view returns (uint256) {
        return transactionHistory[_user].length;
    }
}
