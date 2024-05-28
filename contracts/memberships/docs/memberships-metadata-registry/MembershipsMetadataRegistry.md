# MembershipsMetadataRegistry

_Coinvise_

> MembershipsMetadataRegistry

Registry contract for changing `_baseTokenURI` in Memberships V1

_Owned by Coinvise to control changes to `_baseTokenURI` for Memberships V1 proxies. Used by `Memberships.changeBaseTokenURI()` to fetch allowed baseURI_

## Methods

### baseTokenURI

```solidity
function baseTokenURI(address) external view returns (string)
```

Mapping to store baseTokenURI for each Memberships proxy: membershipsProxyAddress =&gt; baseTokenURI

#### Parameters

| Name | Type    | Description                  |
| ---- | ------- | ---------------------------- |
| \_0  | address | address of memberships proxy |

#### Returns

| Name | Type   | Description                        |
| ---- | ------ | ---------------------------------- |
| \_0  | string | baseTokenURI for memberships proxy |

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

_Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner._

### setBaseTokenURI

```solidity
function setBaseTokenURI(address _membershipsProxy, string _baseTokenURI) external nonpayable
```

Set baseTokenURI for a Memberships Proxy

_Callable only by `owner`._

#### Parameters

| Name               | Type    | Description                                         |
| ------------------ | ------- | --------------------------------------------------- |
| \_membershipsProxy | address | address of Memberships proxy to set `_baseTokenURI` |
| \_baseTokenURI     | string  | baseTokenURI string to set for `_membershipsProxy`  |

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```

_Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner._

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| newOwner | address | undefined   |

## Events

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```

#### Parameters

| Name                    | Type    | Description |
| ----------------------- | ------- | ----------- |
| previousOwner `indexed` | address | undefined   |
| newOwner `indexed`      | address | undefined   |
