import type { Signer } from "@ethersproject/abstract-signer";
import type { MockContract } from "ethereum-waffle";
import { ERC20Token } from "../../src/types/ERC20Token";
import { MembershipsMetadataRegistry } from "../../src/types/MembershipsMetadataRegistry";
import { Memberships } from "../../src/types/Memberships";
import { Memberships as MembershipsV1 } from "../../src/v1/types/Memberships";
import { TestMembershipsFactory } from "../../src/types/TestMembershipsFactory";
import {
  ERC20_TOKEN_DECIMALS,
  ERC20_TOKEN_NAME,
  ERC20_TOKEN_SYMBOL,
  FEE_BPS,
  FEE_TREASURY,
} from "../../helpers/constants";
import {
  deployMemberships,
  deployMembershipsFactory,
  deployERC20Token,
  deployTestMembershipsFactory,
  deployMembershipsMetadataRegistry,
  deployMembershipsV1,
} from "./deployers";
import {
  deployMockERC20Token,
  deployMockMembershipsFactory,
  deployMockMemberships,
  deployMockMembershipsMetadataRegistry,
} from "./mocks";
import { MembershipsFactory } from "../../src/types/MembershipsFactory";
import { getContractAddress } from "ethers/lib/utils";

type UpgradesFixtureReturnType = {
  membershipsMetadataRegistry: MembershipsMetadataRegistry;
  membershipsV1: MembershipsV1;
  memberships: Memberships;
  membershipsFactory: MembershipsFactory;
  testMembershipsFactory: TestMembershipsFactory;
  erc20Token: ERC20Token;
  erc20PaymentToken: ERC20Token;
};

export async function upgradesFixture(signers: Signer[]): Promise<UpgradesFixtureReturnType> {
  const deployer: Signer = signers[0];
  const erc20Token: ERC20Token = await deployERC20Token(deployer, ERC20_TOKEN_NAME, ERC20_TOKEN_SYMBOL);
  const erc20PaymentToken: ERC20Token = await deployERC20Token(deployer, ERC20_TOKEN_NAME, ERC20_TOKEN_SYMBOL);

  const membershipsMetadataRegistry: MembershipsMetadataRegistry = await deployMembershipsMetadataRegistry(deployer);
  const membershipsV1: MembershipsV1 = await deployMembershipsV1(deployer);
  const memberships: Memberships = await deployMemberships(deployer, membershipsMetadataRegistry.address);
  const membershipsFactory: MembershipsFactory = await deployMembershipsFactory(deployer, FEE_BPS, FEE_TREASURY);
  const testMembershipsFactory: TestMembershipsFactory = await deployTestMembershipsFactory(deployer);

  return {
    membershipsMetadataRegistry,
    membershipsV1,
    memberships,
    membershipsFactory,
    testMembershipsFactory,
    erc20Token,
    erc20PaymentToken,
  };
}

type IntegrationFixtureReturnType = {
  membershipsMetadataRegistry: MembershipsMetadataRegistry;
  memberships: Memberships;
  membershipsFactory: MembershipsFactory;
  testMembershipsFactory: TestMembershipsFactory;
  erc20Token: ERC20Token;
  erc20PaymentToken: ERC20Token;
};

export async function integrationFixture(signers: Signer[]): Promise<IntegrationFixtureReturnType> {
  const deployer: Signer = signers[0];
  const erc20Token: ERC20Token = await deployERC20Token(deployer, ERC20_TOKEN_NAME, ERC20_TOKEN_SYMBOL);
  const erc20PaymentToken: ERC20Token = await deployERC20Token(deployer, ERC20_TOKEN_NAME, ERC20_TOKEN_SYMBOL);

  const membershipsMetadataRegistry: MembershipsMetadataRegistry = await deployMembershipsMetadataRegistry(deployer);
  const memberships: Memberships = await deployMemberships(deployer, membershipsMetadataRegistry.address);
  const membershipsFactory: MembershipsFactory = await deployMembershipsFactory(deployer, FEE_BPS, FEE_TREASURY);
  const testMembershipsFactory: TestMembershipsFactory = await deployTestMembershipsFactory(deployer);

  return {
    membershipsMetadataRegistry,
    memberships,
    membershipsFactory,
    testMembershipsFactory,
    erc20Token,
    erc20PaymentToken,
  };
}

type UnitFixtureMembershipsMetadataRegistryReturnType = {
  membershipsMetadataRegistry: MembershipsMetadataRegistry;
};

export async function unitFixtureMembershipsMetadataRegistry(
  signers: Signer[],
): Promise<UnitFixtureMembershipsMetadataRegistryReturnType> {
  const deployer: Signer = signers[0];

  const membershipsMetadataRegistry: MembershipsMetadataRegistry = await deployMembershipsMetadataRegistry(deployer);

  return { membershipsMetadataRegistry };
}

type UnitFixtureMembershipsReturnType = {
  membershipsMetadataRegistry: MockContract;
  memberships: Memberships;
  membershipsFactory: MockContract;
  erc20Token: MockContract;
};

export async function unitFixtureMemberships(signers: Signer[]): Promise<UnitFixtureMembershipsReturnType> {
  const deployer: Signer = signers[0];
  const erc20Token: MockContract = await deployMockERC20Token(
    deployer,
    ERC20_TOKEN_NAME,
    ERC20_TOKEN_SYMBOL,
    ERC20_TOKEN_DECIMALS,
  );

  const membershipsMetadataRegistry: MockContract = await deployMockMembershipsMetadataRegistry(deployer);
  const memberships: Memberships = await deployMemberships(deployer, membershipsMetadataRegistry.address);
  const membershipsFactory: MockContract = await deployMockMembershipsFactory(deployer, FEE_BPS, FEE_TREASURY);

  return { membershipsMetadataRegistry, memberships, membershipsFactory, erc20Token };
}

type UnitFixtureMembershipsFactoryReturnType = {
  memberships: MockContract;
  membershipsFactory: MembershipsFactory;
  erc20Token: MockContract;
};

export async function unitFixtureMembershipsFactory(
  signers: Signer[],
): Promise<UnitFixtureMembershipsFactoryReturnType> {
  const deployer: Signer = signers[0];
  const erc20Token: MockContract = await deployMockERC20Token(
    deployer,
    ERC20_TOKEN_NAME,
    ERC20_TOKEN_SYMBOL,
    ERC20_TOKEN_DECIMALS,
  );

  const deployerAddress = await deployer.getAddress();
  const deployerNoncePlusOne = (await deployer.getTransactionCount()) + 1; // Plus one to account for Memberships deployment prior
  const membershipsFactoryAddress = getContractAddress({ from: deployerAddress, nonce: deployerNoncePlusOne });

  const memberships: MockContract = await deployMockMemberships(deployer, membershipsFactoryAddress);
  const membershipsFactory: MembershipsFactory = await deployMembershipsFactory(deployer, FEE_BPS, FEE_TREASURY);

  return { memberships, membershipsFactory, erc20Token };
}
