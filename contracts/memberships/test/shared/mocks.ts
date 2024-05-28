import type { Signer } from "@ethersproject/abstract-signer";
import { BigNumber, BigNumberish } from "ethers";
import { Zero } from "@ethersproject/constants";
import { MockContract } from "ethereum-waffle";
import hre from "hardhat";
import type { Artifact } from "hardhat/types";

const { deployMockContract } = hre.waffle;

export async function deployMockMembershipsMetadataRegistry(deployer: Signer): Promise<MockContract> {
  const membershipsMetadataRegistryArtifact: Artifact = await hre.artifacts.readArtifact("MembershipsMetadataRegistry");
  const membershipsMetadataRegistry: MockContract = await deployMockContract(
    deployer,
    membershipsMetadataRegistryArtifact.abi,
  );
  return membershipsMetadataRegistry;
}

export async function deployMockMemberships(deployer: Signer, factory: string): Promise<MockContract> {
  const membershipsArtifact: Artifact = await hre.artifacts.readArtifact("Memberships");
  const memberships: MockContract = await deployMockContract(deployer, membershipsArtifact.abi);
  await memberships.mock.factory.returns(factory);
  return memberships;
}

export async function deployMockMembershipsFactory(
  deployer: Signer,
  feeBPS: BigNumberish,
  feeTreasury: string,
): Promise<MockContract> {
  const membershipsFactoryArtifact: Artifact = await hre.artifacts.readArtifact("MembershipsFactory");
  const membershipsFactory: MockContract = await deployMockContract(deployer, membershipsFactoryArtifact.abi);
  await membershipsFactory.mock.feeBPS.returns(feeBPS);
  await membershipsFactory.mock.feeTreasury.returns(feeTreasury);
  return membershipsFactory;
}

export async function deployMockERC20Token(
  deployer: Signer,
  name: string,
  symbol: string,
  decimals: BigNumber,
): Promise<MockContract> {
  const erc20TokenArtifact: Artifact = await hre.artifacts.readArtifact("ERC20Token");
  const erc20Token: MockContract = await deployMockContract(deployer, erc20TokenArtifact.abi);
  await erc20Token.mock.name.returns(name);
  await erc20Token.mock.symbol.returns(symbol);
  await erc20Token.mock.decimals.returns(decimals);
  await erc20Token.mock.totalSupply.returns(Zero);
  return erc20Token;
}
