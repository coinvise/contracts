# MembershipsFactory

_Coinvise_

> MembershipsFactory

Factory contract that can deploy Memberships proxies

## Methods

### deployMemberships

```solidity
function deployMemberships(address _owner, address payable _treasury, string _name, string _symbol, string contractURI_, string baseURI_, IMemberships.Membership _membership) external nonpayable returns (address)
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

#### Returns

| Name | Type    | Description                         |
| ---- | ------- | ----------------------------------- |
| \_0  | address | address of the newly deployed proxy |

### deployMembershipsAtVersion

```solidity
function deployMembershipsAtVersion(uint16 _version, address _owner, address payable _treasury, string _name, string _symbol, string contractURI_, string baseURI_, IMemberships.Membership _membership) external nonpayable returns (address)
```

#### Parameters

| Name          | Type                    | Description                                                                            |
| ------------- | ----------------------- | -------------------------------------------------------------------------------------- |
| \_version     | uint16                  | Memberships implementation version                                                     |
| \_owner       | address                 | Membership owner                                                                       |
| \_treasury    | address payable         | treasury address to withdraw sales funds                                               |
| \_name        | string                  | name for Membership                                                                    |
| \_symbol      | string                  | symbol for Membership                                                                  |
| contractURI\_ | string                  | contractURI for Membership                                                             |
| baseURI\_     | string                  | baseURI for Membership                                                                 |
| \_membership  | IMemberships.Membership | membership parameters: tokenAddress, price, validity, cap, airdropToken, airdropAmount |

#### Returns

| Name | Type    | Description                         |
| ---- | ------- | ----------------------------------- |
| \_0  | address | address of the newly deployed proxy |

### feeBPS

```solidity
function feeBPS() external view returns (uint16)
```

Fee in basis points

#### Returns

| Name | Type   | Description |
| ---- | ------ | ----------- |
| \_0  | uint16 | fee bps     |

### feeTreasury

```solidity
function feeTreasury() external view returns (address payable)
```

treasury address to withdraw fees from Memberships

#### Returns

| Name | Type            | Description          |
| ---- | --------------- | -------------------- |
| \_0  | address payable | fee treasury address |

### membershipsImpls

```solidity
function membershipsImpls(uint16 _version) external view returns (address)
```

Get Memberships implementation address `version`

#### Parameters

| Name      | Type   | Description                           |
| --------- | ------ | ------------------------------------- |
| \_version | uint16 | version of Memberships implementation |

#### Returns

| Name | Type    | Description                                                  |
| ---- | ------- | ------------------------------------------------------------ |
| \_0  | address | address of Memberships implementation contract for `version` |

### membershipsLatestVersion

```solidity
function membershipsLatestVersion() external view returns (uint16)
```

Latest version of Memberships implementation

#### Returns

| Name | Type   | Description                               |
| ---- | ------ | ----------------------------------------- |
| \_0  | uint16 | latest memberships implementation version |

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

### setFeeBPS

```solidity
function setFeeBPS(uint16 _feeBPS) external nonpayable
```

Set fee bps

_Callable only by `owner`. Emits `FeeBPSSet`_

#### Parameters

| Name     | Type   | Description |
| -------- | ------ | ----------- |
| \_feeBPS | uint16 | fee in bps  |

### setFeeTreasury

```solidity
function setFeeTreasury(address payable _feeTreasury) external nonpayable
```

Set fee treasury address

_Callable only by `owner`. Reverts if `_feeTreasury` param is address(0). Emits `FeeTreasurySet`_

#### Parameters

| Name          | Type            | Description                                        |
| ------------- | --------------- | -------------------------------------------------- |
| \_feeTreasury | address payable | treasury address to withdraw fees from Memberships |

### setMembershipsImplAddress

```solidity
function setMembershipsImplAddress(uint16 _version, address _memberships) external nonpayable
```

Set Memberships implementation contract for a version. Also sets `membershipsLatestVersion` if setting a greater version

_Callable only by `owner`. Reverts if `_memberships` param is address(0). Emits `MembershipsImplSet`_

#### Parameters

| Name          | Type    | Description                                    |
| ------------- | ------- | ---------------------------------------------- |
| \_version     | uint16  | version of Memberships implementation          |
| \_memberships | address | address of Memberships implementation contract |

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```

_Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner._

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| newOwner | address | undefined   |

### upgradeProxy

```solidity
function upgradeProxy(uint16 _version, address _membershipsProxy) external nonpayable
```

Upgrade a proxy to latest Memberships implementation

_Callable only by proxy owner. Reverts if `_version &lt;= currentVersion` or if `_version &gt; membershipsLatestVersion`. Reverts if membershipImpl for version is not set_

#### Parameters

| Name               | Type    | Description                     |
| ------------------ | ------- | ------------------------------- |
| \_version          | uint16  | version to upgrade the proxy to |
| \_membershipsProxy | address | address of proxy to upgrade     |

## Events

### FeeBPSSet

```solidity
event FeeBPSSet(uint16 oldFeeBPS, uint16 newFeeBPS)
```

Emitted when feeBPS is changed

#### Parameters

| Name      | Type   | Description |
| --------- | ------ | ----------- |
| oldFeeBPS | uint16 | old feeBPS  |
| newFeeBPS | uint16 | new feeBPS  |

### FeeTreasurySet

```solidity
event FeeTreasurySet(address indexed oldFeeTreasury, address indexed newFeeTreasury)
```

Emitted when fee treasury is changed

#### Parameters

| Name                     | Type    | Description              |
| ------------------------ | ------- | ------------------------ |
| oldFeeTreasury `indexed` | address | old fee treasury address |
| newFeeTreasury `indexed` | address | new fee treasury address |

### MembershipsDeployed

```solidity
event MembershipsDeployed(address indexed membershipsProxy, address indexed owner, address indexed implementation)
```

Emitted when a Memberships proxy is deployed

#### Parameters

| Name                       | Type    | Description                                               |
| -------------------------- | ------- | --------------------------------------------------------- |
| membershipsProxy `indexed` | address | address of the newly deployed proxy                       |
| owner `indexed`            | address | owner of the newly deployed proxy                         |
| implementation `indexed`   | address | implementation contract used for the newly deployed proxy |

### MembershipsImplSet

```solidity
event MembershipsImplSet(uint16 indexed version, address indexed implementation)
```

Emitted when a Memberships implementation contract is set for a version

#### Parameters

| Name                     | Type    | Description                     |
| ------------------------ | ------- | ------------------------------- |
| version `indexed`        | uint16  | version of implementation       |
| implementation `indexed` | address | implementation contract address |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```

#### Parameters

| Name                    | Type    | Description |
| ----------------------- | ------- | ----------- |
| previousOwner `indexed` | address | undefined   |
| newOwner `indexed`      | address | undefined   |

## Errors

### InvalidFeeTreasury

```solidity
error InvalidFeeTreasury()
```

Emitted when trying to set `feeTreasury` to zero address

### InvalidMemberships

```solidity
error InvalidMemberships()
```

Emitted when trying to set `memberships` to zero address

### InvalidUpgrade

```solidity
error InvalidUpgrade(uint16 currentVersion, uint16 upgradeToVersion, uint16 membershipsLatestVersion)
```

Emitted when performing an invalid upgrade

#### Parameters

| Name                     | Type   | Description                                  |
| ------------------------ | ------ | -------------------------------------------- |
| currentVersion           | uint16 | current version of Memberships proxy         |
| upgradeToVersion         | uint16 | version to upgrade the proxy to              |
| membershipsLatestVersion | uint16 | latest version of Memberships implementation |

### Unauthorized

```solidity
error Unauthorized()
```

Emitted when a proxy is being upgraded by other than proxy owner
