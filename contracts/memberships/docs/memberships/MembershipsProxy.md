# MembershipsProxy

_Coinvise_

> MembershipsProxy

Proxy contract that will be deployed by MembershipsFactory

## Methods

### memberships

```solidity
function memberships() external view returns (address)
```

Get implementation contract address

_Reads address set in ERC1967Proxy.\_IMPLEMENTATION_SLOT_

#### Returns

| Name | Type    | Description                        |
| ---- | ------- | ---------------------------------- |
| \_0  | address | address of implementation contract |

### membershipsFactory

```solidity
function membershipsFactory() external view returns (address)
```

Get factory contract address

_Reads address set in \_FACTORY_SLOT_

#### Returns

| Name | Type    | Description                 |
| ---- | ------- | --------------------------- |
| \_0  | address | address of factory contract |

### upgradeMemberships

```solidity
function upgradeMemberships(address _memberships) external nonpayable
```

Upgrade proxy implementation contract

_Callable only by factory_

#### Parameters

| Name          | Type    | Description                                                 |
| ------------- | ------- | ----------------------------------------------------------- |
| \_memberships | address | address of membership implementation contract to upgrade to |

## Events

### AdminChanged

```solidity
event AdminChanged(address previousAdmin, address newAdmin)
```

#### Parameters

| Name          | Type    | Description |
| ------------- | ------- | ----------- |
| previousAdmin | address | undefined   |
| newAdmin      | address | undefined   |

### BeaconUpgraded

```solidity
event BeaconUpgraded(address indexed beacon)
```

#### Parameters

| Name             | Type    | Description |
| ---------------- | ------- | ----------- |
| beacon `indexed` | address | undefined   |

### Upgraded

```solidity
event Upgraded(address indexed implementation)
```

#### Parameters

| Name                     | Type    | Description |
| ------------------------ | ------- | ----------- |
| implementation `indexed` | address | undefined   |

## Errors

### InvalidMemberships

```solidity
error InvalidMemberships()
```

Emitted when MembershipsFactory.memberships() is zero address

### Unauthorized

```solidity
error Unauthorized()
```

Emitted when being called by other than registered factory contract
