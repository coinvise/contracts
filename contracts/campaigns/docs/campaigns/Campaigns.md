# Campaigns

_Coinvise_

> Campaigns

Create ERC20 token / native currency campaigns that are claimable with a signature from a trusted address

## Methods

### campaigns

```solidity
function campaigns(address, uint256) external view returns (address tokenAddress, uint256 maxClaims, uint256 noOfClaims, uint256 amountPerClaim, uint256 isInactive)
```

Mapping to store campaigns: campaignManager =&gt; campaignId =&gt; Campaign

_Helps avoid writing repeated campaignManager addresses in storage. campaignId is only unique to each campaignManager, not global_

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |
| \_1  | uint256 | undefined   |

#### Returns

| Name           | Type    | Description |
| -------------- | ------- | ----------- |
| tokenAddress   | address | undefined   |
| maxClaims      | uint256 | undefined   |
| noOfClaims     | uint256 | undefined   |
| amountPerClaim | uint256 | undefined   |
| isInactive     | uint256 | undefined   |

### claim

```solidity
function claim(address _campaignManager, uint256 _campaignId, bytes32 r, bytes32 s, uint8 v) external payable
```

Claim a campaign

_Transfers campaign.amountPerClaim tokens to claimer. Reverts if - campaign does not exist. - campaign is inactive. - claimer has already claimed before. - campaign is fully claimed. - `claimFee` is not paid. - signature verification fails. Emits `CampaignClaimed`_

#### Parameters

| Name              | Type    | Description                                                        |
| ----------------- | ------- | ------------------------------------------------------------------ |
| \_campaignManager | address | creator of the campaign to claim                                   |
| \_campaignId      | uint256 | id of the campaign to claim. unique to campaignManager, not global |
| r                 | bytes32 | r component of claim signature from `trustedAddress`               |
| s                 | bytes32 | s component of claim signature from `trustedAddress`               |
| v                 | uint8   | v component of claim signature from `trustedAddress`               |

### claimFee

```solidity
function claimFee() external view returns (uint256)
```

Claim Fee

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### createCampaign

```solidity
function createCampaign(address _tokenAddress, uint256 _maxClaims, uint256 _amountPerClaim) external payable returns (uint256 _campaignId)
```

Create a new campaign

_Stores a new `Campaign` to `campaigns[campaignManager][campaignId]`. Transfers the total required tokens from creator to contract. Reverts if `_tokenAddress` is zero. Reverts if `_maxClaims` | `_amountPerClaim` is not greater than zero. Emits `CampaignCreated`_

#### Parameters

| Name             | Type    | Description                                 |
| ---------------- | ------- | ------------------------------------------- |
| \_tokenAddress   | address | address of token used in campaign           |
| \_maxClaims      | uint256 | max no. of claims possible for the campaign |
| \_amountPerClaim | uint256 | amount of tokens received per claim         |

#### Returns

| Name         | Type    | Description |
| ------------ | ------- | ----------- |
| \_campaignId | uint256 | undefined   |

### eip712Domain

```solidity
function eip712Domain() external view returns (bytes1 fields, string name, string version, uint256 chainId, address verifyingContract, bytes32 salt, uint256[] extensions)
```

_See {EIP-5267}. *Available since v4.9.*_

#### Returns

| Name              | Type      | Description |
| ----------------- | --------- | ----------- |
| fields            | bytes1    | undefined   |
| name              | string    | undefined   |
| version           | string    | undefined   |
| chainId           | uint256   | undefined   |
| verifyingContract | address   | undefined   |
| salt              | bytes32   | undefined   |
| extensions        | uint256[] | undefined   |

### hasClaimed

```solidity
function hasClaimed(bytes32) external view returns (uint256)
```

Mapping to store addresses who&#39;ve claimed a campaign: keccak256(abi.encode(campaignManager, campaignId, claimer)) =&gt; claimed

_Helps avoid multiple hashing &amp; inputs for nested mapping_

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | bytes32 | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### initialize

```solidity
function initialize(address _trustedAddress, uint256 _claimFee) external nonpayable
```

_Initialize proxy for Campaigns_

#### Parameters

| Name             | Type    | Description                 |
| ---------------- | ------- | --------------------------- |
| \_trustedAddress | address | Address used for signatures |
| \_claimFee       | uint256 | Claim fee                   |

### owner

```solidity
function owner() external view returns (address)
```

_Returns the address of the current owner._

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```

_Leaves the contract without owner. It will not be possible to call `onlyOwner` functions. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby disabling any functionality that is only available to the owner._

### setClaimFee

```solidity
function setClaimFee(uint256 _claimFee) external payable
```

Set `claimFee`

_Callable only by `owner`._

#### Parameters

| Name       | Type    | Description |
| ---------- | ------- | ----------- |
| \_claimFee | uint256 | Claim fee   |

### setTrustedAddress

```solidity
function setTrustedAddress(address _trustedAddress) external payable
```

Set `trustedAddress`

_Callable only by `owner`. Reverts if `_trustedAddress` is address(0)._

#### Parameters

| Name             | Type    | Description                       |
| ---------------- | ------- | --------------------------------- |
| \_trustedAddress | address | Address to be used for signatures |

### totalClaimFees

```solidity
function totalClaimFees() external view returns (uint256)
```

Total claim fees accrued that is withdrawable

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```

_Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner._

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| newOwner | address | undefined   |

### withdrawCampaign

```solidity
function withdrawCampaign(uint256 _campaignId) external nonpayable
```

Withdraw / Cancel a campaign

_Marks campaign as inactive. Transfers remaining tokens of the campaign to the creator Reverts if campaign does not exist. Reverts if campaign is inactive Emits `CampaignWithdrawn`_

#### Parameters

| Name         | Type    | Description                                    |
| ------------ | ------- | ---------------------------------------------- |
| \_campaignId | uint256 | id of the campaign being withdrawn / cancelled |

### withdrawTotalClaimFees

```solidity
function withdrawTotalClaimFees(address _treasury) external payable
```

Withdraw total claim fees collected

_Transfers `totalClaimFees` to `_treasury` iff it is &gt; 0 Callable only by `owner`. Emits `Withdrawal`_

#### Parameters

| Name       | Type    | Description                                   |
| ---------- | ------- | --------------------------------------------- |
| \_treasury | address | treasury address to which funds are withdrawn |

## Events

### CampaignClaimed

```solidity
event CampaignClaimed(address indexed campaignManager, uint256 indexed campaignId, address indexed claimer, address tokenAddress, uint256 amount)
```

Emitted when `claimer` claims a campaign by `campaignManager` with `campaignId`

#### Parameters

| Name                      | Type    | Description                      |
| ------------------------- | ------- | -------------------------------- |
| campaignManager `indexed` | address | creator of the campaign          |
| campaignId `indexed`      | uint256 | id of the campaign being claimed |
| claimer `indexed`         | address | address of the claimer           |
| tokenAddress              | address | address of token being claimed   |
| amount                    | uint256 | amount of tokens being claimed   |

### CampaignCreated

```solidity
event CampaignCreated(address indexed campaignManager, uint256 indexed campaignId)
```

Emitted when `campaignManager` creates a campaign with `campaignId`

#### Parameters

| Name                      | Type    | Description                                          |
| ------------------------- | ------- | ---------------------------------------------------- |
| campaignManager `indexed` | address | creator of the campaign                              |
| campaignId `indexed`      | uint256 | id of the campaign created under the creator address |

### CampaignWithdrawn

```solidity
event CampaignWithdrawn(address indexed campaignManager, uint256 indexed campaignId)
```

Emitted when `campaignManager` withdraws a campaign with `campaignId`

#### Parameters

| Name                      | Type    | Description                        |
| ------------------------- | ------- | ---------------------------------- |
| campaignManager `indexed` | address | creator of the campaign            |
| campaignId `indexed`      | uint256 | id of the campaign being withdrawn |

### EIP712DomainChanged

```solidity
event EIP712DomainChanged()
```

_MAY be emitted to signal that the domain could have changed._

### Initialized

```solidity
event Initialized(uint8 version)
```

_Triggered when the contract has been initialized or reinitialized._

#### Parameters

| Name    | Type  | Description |
| ------- | ----- | ----------- |
| version | uint8 | undefined   |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```

#### Parameters

| Name                    | Type    | Description |
| ----------------------- | ------- | ----------- |
| previousOwner `indexed` | address | undefined   |
| newOwner `indexed`      | address | undefined   |

### Withdrawal

```solidity
event Withdrawal(uint256 amount, address indexed treasury)
```

Emitted when fees are withdrawn to `treasury`

#### Parameters

| Name               | Type    | Description                                   |
| ------------------ | ------- | --------------------------------------------- |
| amount             | uint256 | amount of funds withdrawn to `treasury`       |
| treasury `indexed` | address | treasury address to which funds are withdrawn |

## Errors

### AlreadyClaimed

```solidity
error AlreadyClaimed()
```

Emitted when user tries to claim campaign more than once

### ExceedsMaxClaims

```solidity
error ExceedsMaxClaims()
```

Emitted when user tries to claim a campaign that&#39;s fully claimed

### InactiveCampaign

```solidity
error InactiveCampaign()
```

Emitted when trying to claim or withdraw an inactive campaign

### IncorrectValue

```solidity
error IncorrectValue()
```

Emitted when incorrect msg.value is passed during purchase or renewal

### InvalidAddress

```solidity
error InvalidAddress()
```

Emitted when trying to set `trustedAddress` to zero address, or claim signature doesn&#39;t match `trustedAddress`

### InvalidCount

```solidity
error InvalidCount()
```

Emitted when trying to create campaign with zero `_maxClaims` or `_amountPerClaim`

### InvalidFee

```solidity
error InvalidFee()
```

Emitted when trying to set `claimFee` to zero

### NonExistentCampaign

```solidity
error NonExistentCampaign()
```

Emitted when trying to claim non existent campaign

### TransferFailed

```solidity
error TransferFailed()
```

Emitted when ether transfer reverted
