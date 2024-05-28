# NFTAirDrop

## Methods

### multiSendERC1155

```solidity
function multiSendERC1155(address tokenAddress, address[] recipients, uint256[] tokenIds, uint256[] amounts) external nonpayable
```

msg.sender should have {setApprovalForAll} true of the ERC1155 method in {tokenAddress}

_Airdrops ERC1155 tokens with {tokenIds} of {amounts} to {recipients} addresses_

#### Parameters

| Name         | Type      | Description           |
| ------------ | --------- | --------------------- |
| tokenAddress | address   | ERC1155 token address |
| recipients   | address[] | recipients addresses  |
| tokenIds     | uint256[] | ERC1155 token IDs     |
| amounts      | uint256[] | amounts to send       |

### multiSendERC721

```solidity
function multiSendERC721(address tokenAddress, address[] recipients, uint256[] tokenIds) external nonpayable
```

msg.sender should have {setApprovalForAll} true of the ERC721 method in {tokenAddress}

_Airdrops ERC721 tokens with {tokenIds} to {recipients} addresses_

#### Parameters

| Name         | Type      | Description          |
| ------------ | --------- | -------------------- |
| tokenAddress | address   | address of ERC721    |
| recipients   | address[] | recipients addresses |
| tokenIds     | uint256[] | ERC721 token IDs     |
