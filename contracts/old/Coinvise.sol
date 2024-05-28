//SPDX-License-Identifier: Unlicensed
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./lib/EIP712MetaTransactionUpgradeable/EIP712MetaTransactionUpgradeable.sol";

// import "hardhat/console.sol";

interface IERC20Extended is IERC20 {
    function decimals() external view returns (uint8);
}

contract Coinvise is
    Initializable,
    OwnableUpgradeable,
    EIP712MetaTransactionUpgradeable
{
    using SafeMath for uint256;
    using SafeERC20 for IERC20Extended;
    using SafeERC20 for IERC20;

    event CampaignCreated(uint256 indexed campaignId);
    event UserRewarded(
        address indexed managerAddress,
        uint256 indexed campaignId,
        address indexed userAddress,
        address tokenAddress,
        uint256 amount
    );
    event Multisent(
        address indexed tokenAddress,
        uint256 recipientsAmount,
        uint256 amount
    );
    event Withdrawn(address indexed recipient, uint256 amount);

    event Deposited(
        uint256 depositId,
        address indexed depositor,
        address token,
        uint256 amount,
        uint256 price
    );
    event Bought(
        address user,
        uint256 depositId,
        address owner,
        address token,
        uint256 amount,
        uint256 price
    );
    event WithdrawnDepositOwnerBalance(address user, uint256 amount);

    struct Campaign {
        uint256 campaignId;
        address manager;
        address tokenAddress;
        uint256 initialBalance;
        uint256 remainingBalance;
        uint256 linksAmount;
        uint256 amountPerLink;
        uint256 linksRewardedCount;
    }

    struct Deposit {
        uint256 depositId;
        address owner;
        address token;
        uint256 initialBalance;
        uint256 remainingBalance;
        uint256 price;
    }

    /**
     * @dev Following are the state variables for this contract
     *      Due to resrictions of the proxy pattern, do not change the type or order
     *      of the state variables.
     *      https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable
     */

    uint256 totalDepositOwnersBalanceInWei;

    // Next campaign ID by manager
    mapping(address => uint256) internal nextCampaignId;

    // All campaigns (userAddress => campaignId => Campaign)
    mapping(address => mapping(uint256 => Campaign)) internal campaigns;

    // All campaign IDs of a user (userAddress => campaignIds[])
    mapping(address => uint256[]) internal campaignIds;

    // Rewarded addresses by a campaign (campaignId => userAddress[])
    mapping(address => mapping(uint256 => mapping(address => bool)))
        internal addressRewarded;

    // Rewarded links by a campaign (campaignId => slug[])
    mapping(uint256 => mapping(string => bool)) internal linksRewarded;

    // Next deposit ID by owner
    mapping(address => uint256) internal nextDepositId;

    // Deposits by user (userAddress => (depositId => deposit)
    mapping(address => mapping(uint256 => Deposit)) internal deposits;

    // All deposits IDs of a user (userAddress => depositIds[])
    mapping(address => uint256[]) internal depositIds;

    // Balances by owner
    mapping(address => uint256) internal depositOwnersBalancesInWei;

    // This is an address whose private key lives in the coinvise backend
    // Used for signature verification
    address private trustedAddress;

    // Premiums Charged on Various Services
    uint256 public airdropPerLinkWeiCharged;
    uint256 public multisendPerLinkWeiCharged;
    uint256 public depositPercentageCharged;
    uint256 public depositPercentageChargedDecimals;

    // Add any new state variables here
    // End of state variables

    /**
     * @dev We cannot have constructors in upgradeable contracts,
     *      therefore we define an initialize function which we call
     *      manually once the contract is deployed.
     *      the initializer modififer ensures that this can only be called once.
     *      in practice, the openzeppelin library automatically calls the intitazie
     *      function once deployed.
     */
    function initialize(
        address _trustedAddress,
        uint256 _airdropPerLinkWeiCharged,
        uint256 _multisendPerLinkWeiCharged,
        uint256 _depositPercentageCharged,
        uint256 _depositPercentageChargedDecimals
    ) public initializer {
        require(
            _trustedAddress != address(0),
            "ERR__INVALID_TRUSTEDADDRESS_0x0"
        );

        // Call intialize of Base Contracts
        require(_trustedAddress != address(0), "ERR__0x0_TRUSTEDADDRESS");

        OwnableUpgradeable.__Ownable_init();
        EIP712MetaTransactionUpgradeable._initialize("Coinvise", "1");
        trustedAddress = _trustedAddress;

        // Set premiums
        require(_depositPercentageCharged < 30, "ERR_DEPOSIT_FEE_TOO_HIGH");
        airdropPerLinkWeiCharged = _airdropPerLinkWeiCharged;
        multisendPerLinkWeiCharged = _multisendPerLinkWeiCharged;
        depositPercentageCharged = _depositPercentageCharged;
        depositPercentageChargedDecimals = _depositPercentageChargedDecimals;
    }

    function setAirdropPremiums(uint256 _airdropPerLinkWeiCharged)
        external
        onlyOwner
    {
        airdropPerLinkWeiCharged = _airdropPerLinkWeiCharged;
    }

    function setMultisendPremiums(uint256 _mulisendPerLinkWeiCharged)
        external
        onlyOwner
    {
        multisendPerLinkWeiCharged = _mulisendPerLinkWeiCharged;
    }

    function setDepositPremiums(
        uint256 _depositPercentageCharged,
        uint256 _depositPercentageChargedDecimals
    ) external onlyOwner {
        require(_depositPercentageCharged < 30, "ERR_DEPOSIT_FEE_TOO_HIGH");
        depositPercentageCharged = _depositPercentageCharged;
        depositPercentageChargedDecimals = _depositPercentageChargedDecimals;
    }

    function setTrustedAddress(address _trustedAddress) external onlyOwner {
        require(_trustedAddress != address(0), "ERR__0x0_TRUSTEDADDRESS");
        trustedAddress = _trustedAddress;
    }

    function withdraw() external onlyOwner {
        uint256 totalBalance = address(this).balance;
        uint256 balance = totalBalance.sub(totalDepositOwnersBalanceInWei);
        msg.sender.transfer(balance);
        emit Withdrawn(msg.sender, balance);
    }

    // Generate Links
    function _createCampaign(
        address _tokenAddress,
        uint256 _linksAmount,
        uint256 _amountPerLink
    ) internal returns (uint256 _campaignId) {
        require(
            _linksAmount > 0,
            "ERR__LINKS_AMOUNT_MUST_BE_GREATHER_THAN_ZERO"
        );
        require(
            _amountPerLink > 0,
            "ERR__AMOUNT_PER_LINK_MUST_BE_GREATHER_THAN_ZERO"
        );

        uint256 _initialBalance = _linksAmount.mul(_amountPerLink);
        address _sender = msgSender();

        IERC20(_tokenAddress).safeTransferFrom(
            _sender,
            address(this),
            _initialBalance
        );

        _campaignId = getCampaignId();

        Campaign memory _campaign = Campaign({
            campaignId: _campaignId,
            manager: _sender,
            tokenAddress: _tokenAddress,
            initialBalance: _initialBalance,
            remainingBalance: _initialBalance,
            linksAmount: _linksAmount,
            amountPerLink: _amountPerLink,
            linksRewardedCount: 0
        });

        campaigns[_sender][_campaignId] = _campaign;
        campaignIds[_sender].push(_campaignId);

        emit CampaignCreated(_campaignId);

        return _campaignId;
    }

    // Generate Links
    // function createCampaignMeta(
    //   address _tokenAddress,
    //   uint256 _linksAmount,
    //   uint256 _amountPerLink
    // ) external returns (uint256) {
    //   return _createCampaign(_tokenAddress, _linksAmount, _amountPerLink);
    // }

    function createCampaign(
        address _tokenAddress,
        uint256 _linksAmount,
        uint256 _amountPerLink
    ) external payable returns (uint256 _campaignId) {
        uint256 priceInWei = airdropPerLinkWeiCharged * _linksAmount;
        require(msg.value == priceInWei, "ERR__CAMPAIGN_PRICE_MUST_BE_PAID");

        return _createCampaign(_tokenAddress, _linksAmount, _amountPerLink);
    }

    function getCampaign(address _campaignManager, uint256 _campaignId)
        external
        view
        returns (
            uint256,
            address,
            address,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        require(
            campaigns[_campaignManager][_campaignId].campaignId == _campaignId,
            "ERR__CAMPAIGN_DOES_NOT_EXIST"
        );

        Campaign memory _campaign = campaigns[_campaignManager][_campaignId];

        return (
            _campaign.campaignId,
            _campaign.manager,
            _campaign.tokenAddress,
            _campaign.initialBalance,
            _campaign.remainingBalance,
            _campaign.linksAmount,
            _campaign.amountPerLink,
            _campaign.linksRewardedCount
        );
    }

    function getCampaignIdsFromManager(address _campaignManager)
        external
        view
        returns (uint256[] memory)
    {
        return campaignIds[_campaignManager];
    }

    function claim(
        address _campaignManager,
        uint256 _campaignId,
        bytes32 r,
        bytes32 s,
        uint8 v
    ) external {
        require(
            campaigns[_campaignManager][_campaignId].campaignId == _campaignId,
            "ERR__CAMPAIGN_DOES_NOT_EXIST"
        );

        address _claimer = msgSender();
        Campaign memory _campaign = campaigns[_campaignManager][_campaignId];

        require(
            addressRewarded[_campaignManager][_campaignId][_claimer] != true,
            "ERR__ADDRESS_ALREADY_REWARDED"
        );
        // require(linksRewarded[_campaignId][_slug] != true, "ERR__LINK_ALREADY_REWARDED");

        // Check if signature is correct
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                keccak256(abi.encode(_campaignManager, _campaignId, _claimer))
            )
        );
        address signer = ecrecover(messageHash, v, r, s);
        require(signer != address(0), "ERR__0x0_SIGNER");
        require(signer == trustedAddress, "ERR__INVALID_SIGNER");

        require(
            _campaign.linksRewardedCount < _campaign.linksAmount,
            "ERR__ALL_LINKS_USED"
        );
        require(
            _campaign.remainingBalance >= _campaign.amountPerLink,
            "ERR_NOT_ENOUGH_BALANCE_FOR_REWARDING"
        );

        address _token = _campaign.tokenAddress;

        IERC20(_token).safeTransfer(_claimer, _campaign.amountPerLink);

        // Mark as rewarded
        addressRewarded[_campaignManager][_campaignId][_claimer] = true;
        campaigns[_campaignManager][_campaignId].linksRewardedCount = _campaign
        .linksRewardedCount
        .add(1);
        campaigns[_campaignManager][_campaignId].remainingBalance = _campaign
        .remainingBalance
        .sub(_campaign.amountPerLink);

        // Emit event
        emit UserRewarded(
            _campaignManager,
            _campaignId,
            _claimer,
            _token,
            _campaign.amountPerLink
        );
    }

    function _multisend(
        address _token,
        address[] memory _recipients,
        uint256[] memory _amounts
    ) internal {
        uint256 recipientsLength = _recipients.length;
        uint256 amountsLength = _amounts.length;

        require(amountsLength == recipientsLength, "ERR__INVALID_ARGS");

        address _user = msgSender();
        uint256 _totalAmount = 0;

        uint8 i = 0;
        for (i; i < recipientsLength; i++) {
            IERC20(_token).safeTransferFrom(_user, _recipients[i], _amounts[i]);
            _totalAmount = _totalAmount.add(_amounts[i]);
        }

        // Emit event
        emit Multisent(_token, recipientsLength, _totalAmount);
    }

    function multisend(
        address _token,
        address[] memory _recipients,
        uint256[] memory _amounts
    ) external payable {
        uint256 recipientsLength = _recipients.length;

        require(
            msg.value == multisendPerLinkWeiCharged * recipientsLength,
            "ERR__MULTISEND_PRICE_MUST_BE_PAID"
        );

        _multisend(_token, _recipients, _amounts);
    }

    // function multisendMeta(
    //   address _token,
    //   address[] memory _recipients,
    //   uint256[] memory _amounts
    // ) external {
    //   _multisend(_token, _recipients, _amounts);
    // }

    function getCampaignId() internal returns (uint256 _campaignId) {
        address _campaignManager = msg.sender;
        _campaignId = nextCampaignId[_campaignManager];

        if (_campaignId <= 0) {
            _campaignId = 1;
        }

        nextCampaignId[_campaignManager] = _campaignId.add(1);

        return _campaignId;
    }

    function getCampaignRewardedCount(address _manager, uint256 _campaignId)
        external
        view
        returns (uint256)
    {
        return campaigns[_manager][_campaignId].linksRewardedCount;
    }

    function _depositToken(
        address _token,
        uint256 _amount,
        uint256 _price
    ) internal returns (uint256 _depositId) {
        require(_amount > 0, "ERR__AMOUNT_MUST_BE_GREATHER_THAN_ZERO");
        require(_price > 0, "ERR__PRICE_MUST_BE_GREATHER_THAN_ZERO");

        IERC20Extended tokenContract = IERC20Extended(_token);

        address _owner = msg.sender;
        tokenContract.safeTransferFrom(_owner, address(this), _amount);

        _depositId = getDepositId();
        Deposit memory _deposit = Deposit({
            depositId: _depositId,
            owner: _owner,
            token: _token,
            initialBalance: _amount,
            remainingBalance: _amount,
            price: _price
        });

        deposits[_owner][_depositId] = _deposit;
        depositIds[_owner].push(_depositId);

        emit Deposited(_depositId, _owner, _token, _amount, _price);
    }

    function depositToken(
        address _token,
        uint256 _amount,
        uint256 _price
    ) external payable returns (uint256 _depositId) {
        IERC20Extended tokenContract = IERC20Extended(_token);
        uint256 decimalsZeros = 10**tokenContract.decimals();

        // Fee = 2% of the total. (tokenAmount * values.tokenPrice * 0.02) / depositPercentageChargedDecimals
        // (depositPercentageChargedDecimals is used for when depositPercentageCharged < 0.01)

        // OLD
        // uint256 priceInWei = _price
        //   .mul(_amount)
        //   .div(decimalsZeros)
        //   .mul(depositPercentageCharged)
        //   .div(100)
        //   .div(10**depositPercentageChargedDecimals);

        // Same formula but only dividing once, avoiding truncation as much as possible
        uint256 bigTotal = _price.mul(_amount).mul(depositPercentageCharged);
        uint256 zeroes = decimalsZeros.mul(100).mul(
            10**depositPercentageChargedDecimals
        );
        uint256 priceInWei = bigTotal.div(zeroes);
        require(priceInWei > 0, "ERR__A_PRICE_MUST_BE_PAID");
        require(msg.value == priceInWei, "ERR__PRICE_MUST_BE_PAID");

        return _depositToken(_token, _amount, _price);
    }

    function getDepositIdsFromOwner(address _owner)
        external
        view
        returns (uint256[] memory)
    {
        return depositIds[_owner];
    }

    function getDeposit(address _owner, uint256 _depositId)
        external
        view
        returns (
            uint256,
            address,
            address,
            uint256,
            uint256,
            uint256
        )
    {
        require(
            deposits[_owner][_depositId].depositId == _depositId,
            "ERR__DEPOSIT_DOES_NOT_EXIST"
        );

        Deposit memory _deposit = deposits[_owner][_depositId];

        return (
            _deposit.depositId,
            _deposit.owner,
            _deposit.token,
            _deposit.initialBalance,
            _deposit.remainingBalance,
            _deposit.price
        );
    }

    function buyToken(
        uint256 _depositId,
        address payable _owner,
        uint256 _amount
    ) external payable {
        require(
            deposits[_owner][_depositId].depositId == _depositId,
            "ERR__DEPOSIT_DOES_NOT_EXIST"
        );
        Deposit memory _deposit = deposits[_owner][_depositId];
        require(_amount > 0, "ERR__AMOUNT_MUST_BE_GREATHER_THAN_ZERO");
        require(
            _deposit.remainingBalance >= _amount,
            "ERR_NOT_ENOUGH_BALANCE_TO_BUY"
        );

        IERC20Extended tokenContract = IERC20Extended(_deposit.token);
        uint256 decimalsZeros = 10**tokenContract.decimals();
        uint256 totalPrice = _deposit.price.mul(_amount).div(decimalsZeros);
        require(totalPrice > 0, "ERR__A_PRICE_MUST_BE_PAID");
        require(msg.value == totalPrice, "ERR__TOTAL_PRICE_MUST_BE_PAID");

        deposits[_owner][_depositId].remainingBalance = _deposit
        .remainingBalance
        .sub(_amount);
        IERC20(_deposit.token).safeTransfer(msg.sender, _amount);

        depositOwnersBalancesInWei[_owner] = depositOwnersBalancesInWei[_owner]
        .add(msg.value);
        totalDepositOwnersBalanceInWei = totalDepositOwnersBalanceInWei.add(
            msg.value
        );

        emit Bought(
            msg.sender,
            _depositId,
            _owner,
            _deposit.token,
            _amount,
            _deposit.price
        );
    }

    function withdrawDeposit(uint256 _depositId) external {
        address _owner = msg.sender;
        require(
            deposits[_owner][_depositId].depositId == _depositId,
            "ERR__DEPOSIT_DOES_NOT_EXIST"
        );
        Deposit memory _deposit = deposits[_owner][_depositId];
        require(_deposit.remainingBalance > 0, "ERR_NO_BALANCE_TO_WITHDRAW");

        deposits[_owner][_depositId].remainingBalance = 0;
        delete deposits[_owner][_depositId];
        IERC20(_deposit.token).safeTransfer(_owner, _deposit.remainingBalance);
    }

    function withdrawDepositOwnerBalance() external {
        address payable owner = msg.sender;
        require(
            depositOwnersBalancesInWei[owner] > 0,
            "ERR_NO_BALANCE_TO_WITHDRAW"
        );
        uint256 toWithdraw = depositOwnersBalancesInWei[owner];
        depositOwnersBalancesInWei[owner] = 0;
        totalDepositOwnersBalanceInWei = totalDepositOwnersBalanceInWei.sub(
            toWithdraw
        );
        require(
            totalDepositOwnersBalanceInWei >= 0,
            "ERR_NO_GENERAL_BALANCE_TO_WITHDRAW"
        );

        owner.transfer(toWithdraw);

        emit WithdrawnDepositOwnerBalance(owner, toWithdraw);
    }

    function getDepositOwnerBalance() external view returns (uint256) {
        return depositOwnersBalancesInWei[msg.sender];
    }

    function getCoinviseBalance() external view returns (uint256) {
        uint256 totalBalance = address(this).balance;
        return totalBalance.sub(totalDepositOwnersBalanceInWei);
    }

    function getDepositId() internal returns (uint256 _depositId) {
        _depositId = nextDepositId[msg.sender];

        if (_depositId <= 0) {
            _depositId = 1;
        }

        nextDepositId[msg.sender] = _depositId.add(1);

        return _depositId;
    }
}
