# Memberships

_Coinvise_

> Memberships

Implementation contract for Coinvise Memberships

_Proxies for this contract will be deployed by registered MembershipsFactory contract. Allows owner to pause/unpause purchases, mint, withdraw funds and change royalty info. Allows anyone to purchase and renew memberships_

## Methods

### airdropAmount

```solidity
function airdropAmount() external view returns (uint256)
```

Membership airdrop amount

_Should be in `airdropToken` decimals. Automatically set to 0 if `airdropToken` is address(0)_

#### Returns

| Name | Type    | Description    |
| ---- | ------- | -------------- |
| \_0  | uint256 | airdrop amount |

### airdropToken

```solidity
function airdropToken() external view returns (address)
```

Membership airdrop token address

_Can be address(0) when there should be no airdrop_

#### Returns

| Name | Type    | Description   |
| ---- | ------- | ------------- |
| \_0  | address | airdrop token |

### approve

```solidity
function approve(address to, uint256 tokenId) external nonpayable
```

_See {IERC721-approve}._

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| to      | address | undefined   |
| tokenId | uint256 | undefined   |

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256)
```

_See {IERC721-balanceOf}._

#### Parameters

| Name  | Type    | Description |
| ----- | ------- | ----------- |
| owner | address | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### cap

```solidity
function cap() external view returns (uint256)
```

Membership cap

#### Returns

| Name | Type    | Description    |
| ---- | ------- | -------------- |
| \_0  | uint256 | membership cap |

### changeBaseTokenURI

```solidity
function changeBaseTokenURI() external nonpayable
```

Change baseTokenURI for Membership

_Callable only by `owner`. Reinitializes into version 2 to restrict as callable only once._

### contractURI

```solidity
function contractURI() external view returns (string)
```

Get contract-level metadata URI

#### Returns

| Name | Type   | Description                          |
| ---- | ------ | ------------------------------------ |
| \_0  | string | URI to fetch contract-level metadata |

### expirationTimestampOf

```solidity
function expirationTimestampOf(uint256 tokenId) external view returns (uint256)
```

Get expiration timestamp for a given token

_Reverts if checking non-existent token_

#### Parameters

| Name    | Type    | Description          |
| ------- | ------- | -------------------- |
| tokenId | uint256 | tokenId of the token |

#### Returns

| Name | Type    | Description                              |
| ---- | ------- | ---------------------------------------- |
| \_0  | uint256 | Expiration timestamp for the given token |

### factory

```solidity
function factory() external view returns (address)
```

Factory contract that deployed this proxy

#### Returns

| Name | Type    | Description                |
| ---- | ------- | -------------------------- |
| \_0  | address | MembershipsFactory address |

### getApproved

```solidity
function getApproved(uint256 tokenId) external view returns (address)
```

_See {IERC721-getApproved}._

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| tokenId | uint256 | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

### hasValidToken

```solidity
function hasValidToken(address _owner) external view returns (bool)
```

Check if `owner` has at least one non-expired token

_Checks validity of all tokens owned by `owner` using `tokenOfOwnerByIndex()` and `isValid()`_

#### Parameters

| Name    | Type    | Description                            |
| ------- | ------- | -------------------------------------- |
| \_owner | address | owner address to check for valid token |

#### Returns

| Name | Type | Description                                                |
| ---- | ---- | ---------------------------------------------------------- |
| \_0  | bool | boolean whether `owner` has at least one non-expired token |

### initialize

```solidity
function initialize(address _owner, address payable _treasury, string _name, string _symbol, string contractURI_, string baseURI_, IMemberships.Membership _membership) external nonpayable
```

#### Parameters

| Name          | Type                    | Description                                                                            |
| ------------- | ----------------------- | -------------------------------------------------------------------------------------- |
| \_owner       | address                 | Membership owner                                                                       |
| \_treasury    | address payable         | treasury address to withdraw sales funds                                               |
| \_name        | string                  | name for Membership                                                                    |
| \_symbol      | string                  | symbol for Membership                                                                  |
| contractURI\_ | string                  | contractURI for Membership                                                             |
| baseURI\_     | string                  | baseURI for Membership                                                                 |
| \_membership  | IMemberships.Membership | membership parameters: tokenAddress, price, validity, cap, airdropToken, airdropAmount |

### isApprovedForAll

```solidity
function isApprovedForAll(address owner, address operator) external view returns (bool)
```

_See {IERC721-isApprovedForAll}._

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| owner    | address | undefined   |
| operator | address | undefined   |

#### Returns

| Name | Type | Description |
| ---- | ---- | ----------- |
| \_0  | bool | undefined   |

### isValid

```solidity
function isValid(uint256 tokenId) external view returns (bool)
```

Check if a token is valid

_Checks whether a token&#39;s \_expirationTimestamp &gt; now. Reverts if checking non-existent token_

#### Parameters

| Name    | Type    | Description               |
| ------- | ------- | ------------------------- |
| tokenId | uint256 | tokenId to check validity |

#### Returns

| Name | Type | Description                    |
| ---- | ---- | ------------------------------ |
| \_0  | bool | boolean whether token is valid |

### mint

```solidity
function mint(address recipient) external nonpayable returns (uint256, uint256)
```

Mint a Membership without having to purchase it

_Callable only by `owner`. Emits `MembershipMinted`_

#### Parameters

| Name      | Type    | Description                 |
| --------- | ------- | --------------------------- |
| recipient | address | recipient of the membership |

#### Returns

| Name | Type    | Description                                  |
| ---- | ------- | -------------------------------------------- |
| \_0  | uint256 | tokenId of the minted membership             |
| \_1  | uint256 | expirationTimestamp of the minted membership |

### name

```solidity
function name() external view returns (string)
```

_See {IERC721Metadata-name}._

#### Returns

| Name | Type   | Description |
| ---- | ------ | ----------- |
| \_0  | string | undefined   |

### owner

```solidity
function owner() external view returns (address)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

### ownerOf

```solidity
function ownerOf(uint256 tokenId) external view returns (address)
```

_See {IERC721-ownerOf}._

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| tokenId | uint256 | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

### pause

```solidity
function pause() external nonpayable
```

Pause Membership purchases and renewals

_Callable only by `owner`_

### paused

```solidity
function paused() external view returns (bool)
```

_Returns true if the contract is paused, and false otherwise._

#### Returns

| Name | Type | Description |
| ---- | ---- | ----------- |
| \_0  | bool | undefined   |

### price

```solidity
function price() external view returns (uint256)
```

Membership price

#### Returns

| Name | Type    | Description      |
| ---- | ------- | ---------------- |
| \_0  | uint256 | membership price |

### purchase

```solidity
function purchase(address recipient) external payable returns (uint256, uint256)
```

Purchase a Membership by paying `price`

_Transfers payment token. Reverts if purchases are paused. Reverts if `msg.value` is not set to `price`. Emits `MembershipPurchased`_

#### Parameters

| Name      | Type    | Description                 |
| --------- | ------- | --------------------------- |
| recipient | address | recipient of the membership |

#### Returns

| Name | Type    | Description                                     |
| ---- | ------- | ----------------------------------------------- |
| \_0  | uint256 | tokenId of the purchased membership             |
| \_1  | uint256 | expirationTimestamp of the purchased membership |

### renew

```solidity
function renew(uint256 tokenId) external payable returns (uint256)
```

Renew membership for a token

_Transfers payment token. Reverts if renewals are paused. Reverts if `msg.value` is not set to `price`. Emits `MembershipRenewed`_

#### Parameters

| Name    | Type    | Description                   |
| ------- | ------- | ----------------------------- |
| tokenId | uint256 | tokenId of the token to renew |

#### Returns

| Name | Type    | Description                              |
| ---- | ------- | ---------------------------------------- |
| \_0  | uint256 | updated expirationTimestamp of the token |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```

_Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner._

### royaltyInfo

```solidity
function royaltyInfo(uint256 _tokenId, uint256 _salePrice) external view returns (address, uint256)
```

_Returns how much royalty is owed and to whom, based on a sale price that may be denominated in any unit of exchange. The royalty amount is denominated and should be paid in that same unit of exchange._

#### Parameters

| Name        | Type    | Description |
| ----------- | ------- | ----------- |
| \_tokenId   | uint256 | undefined   |
| \_salePrice | uint256 | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |
| \_1  | uint256 | undefined   |

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId) external nonpayable
```

_See {IERC721-safeTransferFrom}._

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| from    | address | undefined   |
| to      | address | undefined   |
| tokenId | uint256 | undefined   |

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 tokenId, bytes _data) external nonpayable
```

_See {IERC721-safeTransferFrom}._

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| from    | address | undefined   |
| to      | address | undefined   |
| tokenId | uint256 | undefined   |
| \_data  | bytes   | undefined   |

### setApprovalForAll

```solidity
function setApprovalForAll(address operator, bool approved) external nonpayable
```

_See {IERC721-setApprovalForAll}._

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| operator | address | undefined   |
| approved | bool    | undefined   |

### setDefaultRoyalty

```solidity
function setDefaultRoyalty(address _receiver, uint96 _feeNumerator) external nonpayable
```

Set ERC2981 default royalty for all tokenIds

_Exposes ERC2981Upgradeable.\_setDefaultRoyalty(). Callable only by `owner`_

#### Parameters

| Name           | Type    | Description                  |
| -------------- | ------- | ---------------------------- |
| \_receiver     | address | royalty receiver address     |
| \_feeNumerator | uint96  | royaltyFraction basis points |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool)
```

#### Parameters

| Name        | Type   | Description |
| ----------- | ------ | ----------- |
| interfaceId | bytes4 | undefined   |

#### Returns

| Name | Type | Description |
| ---- | ---- | ----------- |
| \_0  | bool | undefined   |

### symbol

```solidity
function symbol() external view returns (string)
```

_See {IERC721Metadata-symbol}._

#### Returns

| Name | Type   | Description |
| ---- | ------ | ----------- |
| \_0  | string | undefined   |

### tokenAddress

```solidity
function tokenAddress() external view returns (address)
```

Membership price token address

#### Returns

| Name | Type    | Description                    |
| ---- | ------- | ------------------------------ |
| \_0  | address | membership price token address |

### tokenByIndex

```solidity
function tokenByIndex(uint256 index) external view returns (uint256)
```

_See {IERC721Enumerable-tokenByIndex}._

#### Parameters

| Name  | Type    | Description |
| ----- | ------- | ----------- |
| index | uint256 | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### tokenOfOwnerByIndex

```solidity
function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)
```

_See {IERC721Enumerable-tokenOfOwnerByIndex}._

#### Parameters

| Name  | Type    | Description |
| ----- | ------- | ----------- |
| owner | address | undefined   |
| index | uint256 | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### tokenURI

```solidity
function tokenURI(uint256 tokenId) external view returns (string)
```

_See {IERC721Metadata-tokenURI}._

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| tokenId | uint256 | undefined   |

#### Returns

| Name | Type   | Description |
| ---- | ------ | ----------- |
| \_0  | string | undefined   |

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

_See {IERC721Enumerable-totalSupply}._

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 tokenId) external nonpayable
```

_See {IERC721-transferFrom}._

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| from    | address | undefined   |
| to      | address | undefined   |
| tokenId | uint256 | undefined   |

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```

_Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner._

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| newOwner | address | undefined   |

### treasury

```solidity
function treasury() external view returns (address payable)
```

Treasury address to withdraw sales funds

#### Returns

| Name | Type            | Description         |
| ---- | --------------- | ------------------- |
| \_0  | address payable | membership treasury |

### unpause

```solidity
function unpause() external nonpayable
```

Unpause Membership purchases and renewals

_Callable only by `owner`_

### validity

```solidity
function validity() external view returns (uint256)
```

Membership validity duration in seconds for which a membership is valid after each purchase or renewal

_Can be type(uint256).max for lifetime validity_

#### Returns

| Name | Type    | Description         |
| ---- | ------- | ------------------- |
| \_0  | uint256 | membership validity |

### version

```solidity
function version() external pure returns (uint16)
```

Get Memberships implementation version

#### Returns

| Name | Type   | Description                        |
| ---- | ------ | ---------------------------------- |
| \_0  | uint16 | Memberships implementation version |

### withdraw

```solidity
function withdraw() external nonpayable
```

Withdraw sales proceedings along with fees

_Calculates and transfers fee from balance and `feeBPS` to `feeTreasury`. Callable only by `owner`. Emits `Withdrawal`_

## Events

### Approval

```solidity
event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)
```

#### Parameters

| Name               | Type    | Description |
| ------------------ | ------- | ----------- |
| owner `indexed`    | address | undefined   |
| approved `indexed` | address | undefined   |
| tokenId `indexed`  | uint256 | undefined   |

### ApprovalForAll

```solidity
event ApprovalForAll(address indexed owner, address indexed operator, bool approved)
```

#### Parameters

| Name               | Type    | Description |
| ------------------ | ------- | ----------- |
| owner `indexed`    | address | undefined   |
| operator `indexed` | address | undefined   |
| approved           | bool    | undefined   |

### Initialized

```solidity
event Initialized(uint8 version)
```

#### Parameters

| Name    | Type  | Description |
| ------- | ----- | ----------- |
| version | uint8 | undefined   |

### MembershipMinted

```solidity
event MembershipMinted(uint256 indexed tokenId, address indexed recipient, uint256 expirationTimestamp)
```

Emitted when `tokenId` is minted by `owner` for `recipient`

#### Parameters

| Name                | Type    | Description                              |
| ------------------- | ------- | ---------------------------------------- |
| tokenId `indexed`   | uint256 | tokenId of membership minted             |
| recipient `indexed` | address | recipient of the membership              |
| expirationTimestamp | uint256 | expiration timestamp of membership token |

### MembershipPurchased

```solidity
event MembershipPurchased(uint256 indexed tokenId, address indexed recipient, uint256 expirationTimestamp)
```

Emitted when `tokenId` is purchased by `recipient`

#### Parameters

| Name                | Type    | Description                              |
| ------------------- | ------- | ---------------------------------------- |
| tokenId `indexed`   | uint256 | tokenId of membership purchased          |
| recipient `indexed` | address | recipient of the membership              |
| expirationTimestamp | uint256 | expiration timestamp of membership token |

### MembershipRenewed

```solidity
event MembershipRenewed(uint256 indexed tokenId, uint256 newExpirationTimestamp)
```

Emitted when a membership is renewed

#### Parameters

| Name                   | Type    | Description                                      |
| ---------------------- | ------- | ------------------------------------------------ |
| tokenId `indexed`      | uint256 | tokenId of membership renewed                    |
| newExpirationTimestamp | uint256 | updated expiration timestamp of membership token |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```

#### Parameters

| Name                    | Type    | Description |
| ----------------------- | ------- | ----------- |
| previousOwner `indexed` | address | undefined   |
| newOwner `indexed`      | address | undefined   |

### Paused

```solidity
event Paused(address account)
```

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| account | address | undefined   |

### Transfer

```solidity
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
```

#### Parameters

| Name              | Type    | Description |
| ----------------- | ------- | ----------- |
| from `indexed`    | address | undefined   |
| to `indexed`      | address | undefined   |
| tokenId `indexed` | uint256 | undefined   |

### Unpaused

```solidity
event Unpaused(address account)
```

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| account | address | undefined   |

### Withdrawal

```solidity
event Withdrawal(uint256 amount, address indexed treasury, uint256 fee, address indexed feeTreasury)
```

Emitted when funds are withdrawn

#### Parameters

| Name                  | Type    | Description                                       |
| --------------------- | ------- | ------------------------------------------------- |
| amount                | uint256 | amount of funds withdrawn to `treasury`           |
| treasury `indexed`    | address | treasury address to which funds are withdrawn     |
| fee                   | uint256 | amount of funds withdrawn to `feeTreasury` as fee |
| feeTreasury `indexed` | address | treasury address to which fees are withdrawn      |

## Errors

### IncorrectValue

```solidity
error IncorrectValue()
```

Emitted when incorrect msg.value is passed during purchase or renewal

### InsufficientBalance

```solidity
error InsufficientBalance()
```

Emitted when there is insufficient balance during ether transfer

### InvalidBaseTokenURI

```solidity
error InvalidBaseTokenURI()
```

Emitted when no baseTokenURI set for proxy when changing

### InvalidRenewal

```solidity
error InvalidRenewal()
```

Emitted when trying to renew lifetime membership

### NonExistentToken

```solidity
error NonExistentToken()
```

Emitted when accessing token that has not been minted yet

### SaleComplete

```solidity
error SaleComplete()
```

Emitted when allowed number of memberships have been completely purchased/minted

### TransferFailed

```solidity
error TransferFailed()
```

Emitted when ether transfer reverted

### Unauthorized

```solidity
error Unauthorized()
```

Emitted when being initialized by other than registered factory contract
