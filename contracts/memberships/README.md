# Memberships

Tech stack:

- [Hardhat](https://github.com/nomiclabs/hardhat): compile and run the smart contracts on a local development network
- [TypeChain](https://github.com/ethereum-ts/TypeChain): generate TypeScript types for smart contracts
- [Ethers](https://github.com/ethers-io/ethers.js/): renowned Ethereum library and wallet implementation
- [Waffle](https://github.com/EthWorks/Waffle): tooling for writing comprehensive smart contract tests
- [Solhint](https://github.com/protofire/solhint): linter
- [Solcover](https://github.com/sc-forks/solidity-coverage): code coverage
- [Prettier Plugin Solidity](https://github.com/prettier-solidity/prettier-plugin-solidity): code formatter

## Usage

### Hardhat Tasks

#### 1. Deploy Memberships

```sh
yarn deploy:Memberships \
  --network polygon-mumbai \
  --confirmations 5
```

#### 2. Deploy MembershipsFactory

```sh
yarn deploy:MembershipsFactory \
  --network polygon-mumbai \
  --confirmations 5 \
  --memberships 0xc0DA426fAcC3C45645332d2FA24A0e4026C3571F \    # Memberships V1 impl address
  --fee-bps 250 \
  # --fee-treasury <replace_feeTreasury_address>
```

#### 3. Approve ERC20 Token for MembershipsFactory

```sh
yarn run:approveERC20Token \
  --network polygon-mumbai \
  # --erc20-token <replace_erc20token_address> \
  --spender 0x375005daef4edadb6310dca0c8190cf4bf41fbef \    # MembershipsFactory address
  --amount 1000000000000000000000 # 1000 tokens with 18 decimals
```

<details>
  <summary>Optionals:</summary>

#### 1. Upload contract metadata

```sh
yarn run:uploadMetadata:contract:nftStorage \
  # --name <replace_membership_name> \
  # --description <replace_membership_description> \
  # --image-uri <replace_image_uri> \ # uploads default image if not set
  # --external-link-url <replace_membership_external_url> \
  # --seller-fee-basis-points <replace_membership_royalty_bps> \
  # --fee-recipient <replace_royalty_recipient>
```

#### 2. Upload tokens' metadata

```sh
yarn run:uploadMetadata:token:nftStorage \
  # --name <replace_membership_name> \
  # --description <replace_membership_description> \
  # --animation-url <replace_image_uri> \
  # --image-uri <replace_image_uri> \ # uploads default image if not set
  # --count <replace_membership_cap>
```

</details>

#### 4. Create Memberships: `MembershipsFactory.deployMemberships()`

```sh
yarn run:deployMemberships \
  --network polygon-mumbai \
  --factory 0x375005daef4edadb6310dca0c8190cf4bf41fbef \    # MembershipsFactory address
  # --owner <replace_owner_address> \
  # --membership-token-address <replace_erc20token_address> \
  # --treasury <replace_treasury_address> \
  # --membership-airdrop-token <replace_erc20token_address> \
  --membership-airdrop-amount 10000000000000000000 \  # 10 tokens with 18 decimals
  --upload-metadata true # upload and use new metadata
```

#### 5. Purchase Memberships: `Memberships.purchase()`

```sh
yarn run:purchaseMembership \
  --network polygon-mumbai \
  # --memberships-proxy <replace_memberships_proxy_address>
  # --recipient <replace_recipient_address>
```

#### 6. Mint Memberships: `Memberships.mint()`

```sh
yarn run:mintMembership \
  --network polygon-mumbai \
  # --memberships-proxy <replace_memberships_proxy_address>
  # --recipient <replace_recipient_address>
```

### Pre Requisites

Before running any command, you need to create a `.env` file and set a BIP-39 compatible mnemonic as an environment
variable. Follow the example in `.env.example`. If you don't already have a mnemonic, use this [website](https://iancoleman.io/bip39/) to generate one.

Then, proceed with installing dependencies:

```sh
yarn install
```

### Compile

Compile the smart contracts with Hardhat:

```sh
$ yarn compile
```

### TypeChain

Compile the smart contracts and generate TypeChain artifacts:

```sh
$ yarn typechain
```

### Lint Solidity

Lint the Solidity code:

```sh
$ yarn lint:sol
```

### Lint TypeScript

Lint the TypeScript code:

```sh
$ yarn lint:ts
```

### Test

Run the Mocha tests:

```sh
$ yarn test
```

### Coverage

Generate the code coverage report:

```sh
$ yarn coverage
```

### Report Gas

See the gas usage per unit test and average gas per method call:

```sh
$ REPORT_GAS=true yarn test
```

### Clean

Delete the smart contract artifacts, the coverage reports and the Hardhat cache:

```sh
$ yarn clean
```

### Deploy

Deploy the contracts to Hardhat Network:

```sh
$ yarn deploy --greeting "Bonjour, le monde!"
```

## Syntax Highlighting

If you use VSCode, you can enjoy syntax highlighting for your Solidity code via the
[vscode-solidity](https://github.com/juanfranblanco/vscode-solidity) extension. The recommended approach to set the
compiler version is to add the following fields to your VSCode user settings:

```json
{
  "solidity.compileUsingRemoteVersion": "v0.8.4+commit.c7e474f2",
  "solidity.defaultCompiler": "remote"
}
```

Where of course `v0.8.4+commit.c7e474f2` can be replaced with any other version.
