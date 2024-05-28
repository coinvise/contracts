import type { Signer } from "@ethersproject/abstract-signer";
import { artifacts, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

import { MembershipsMetadataRegistry } from "../../src/types/MembershipsMetadataRegistry";
import { Memberships__factory as MembershipsV1__factory } from "../../src/v1/types/factories/Memberships__factory";
import { Memberships as MembershipsV1 } from "../../src/v1/types/Memberships";
import { Memberships } from "../../src/types/Memberships";
import { MembershipsFactory } from "../../src/types/MembershipsFactory";
import { TestMembershipsFactory } from "../../src/types/TestMembershipsFactory";
import { TestMembershipsV2 } from "../../src/types/TestMembershipsV2";
import { TestMembershipsV3 } from "../../src/types/TestMembershipsV3";
import { ERC20Token } from "../../src/types/ERC20Token";
import { BigNumberish } from "ethers";
import { ContractJSON } from "ethereum-waffle/dist/esm/ContractJSON";

const { deployContract } = waffle;

export async function deployMembershipsMetadataRegistry(deployer: Signer): Promise<MembershipsMetadataRegistry> {
  const membershipsMetadataRegistryArtifact: Artifact = await artifacts.readArtifact("MembershipsMetadataRegistry");
  const membershipsMetadataRegistry: MembershipsMetadataRegistry = <MembershipsMetadataRegistry>(
    await deployContract(deployer, membershipsMetadataRegistryArtifact)
  );
  return membershipsMetadataRegistry;
}

export async function deployMembershipsV1(deployer: Signer): Promise<MembershipsV1> {
  const membershipsV1Artifact: ContractJSON = {
    abi: MembershipsV1__factory.abi,
    bytecode: MembershipsV1__factory.bytecode,
  };
  const membershipsV1: MembershipsV1 = <MembershipsV1>await deployContract(deployer, membershipsV1Artifact);
  return membershipsV1;
}

export async function deployMemberships(deployer: Signer, membershipsMetadataRegistry: string): Promise<Memberships> {
  const membershipsArtifact: Artifact = await artifacts.readArtifact("Memberships");
  const memberships: Memberships = <Memberships>(
    await deployContract(deployer, membershipsArtifact, [membershipsMetadataRegistry])
  );
  return memberships;
}

export async function deployMembershipsFactory(
  deployer: Signer,
  feeBPS: BigNumberish,
  feeTreasury: string,
): Promise<MembershipsFactory> {
  const membershipsFactoryArtifact: Artifact = await artifacts.readArtifact("MembershipsFactory");
  const membershipsFactory: MembershipsFactory = <MembershipsFactory>(
    await deployContract(deployer, membershipsFactoryArtifact, [feeBPS, feeTreasury])
  );
  return membershipsFactory;
}

export async function deployTestMembershipsFactory(deployer: Signer): Promise<TestMembershipsFactory> {
  const testMembershipsFactoryArtifact: Artifact = await artifacts.readArtifact("TestMembershipsFactory");
  const testMembershipsFactory: TestMembershipsFactory = <TestMembershipsFactory>(
    await deployContract(deployer, testMembershipsFactoryArtifact)
  );
  return testMembershipsFactory;
}

export async function deployERC20Token(deployer: Signer, name: string, symbol: string): Promise<ERC20Token> {
  const erc20TokenArtifact: Artifact = await artifacts.readArtifact("ERC20Token");
  const erc20Token: ERC20Token = <ERC20Token>await deployContract(deployer, erc20TokenArtifact, [name, symbol]);
  return erc20Token;
}

export async function deployTestMembershipsV2(
  deployer: Signer,
  membershipsMetadataRegistry: string,
): Promise<TestMembershipsV2> {
  const testMembershipsV2Artifact: Artifact = await artifacts.readArtifact("TestMembershipsV2");
  const testMembershipsV2: TestMembershipsV2 = <TestMembershipsV2>(
    await deployContract(deployer, testMembershipsV2Artifact, [membershipsMetadataRegistry])
  );
  return testMembershipsV2;
}

export async function deployTestMembershipsV3(
  deployer: Signer,
  membershipsMetadataRegistry: string,
): Promise<TestMembershipsV3> {
  const testMembershipsV3Artifact: Artifact = await artifacts.readArtifact("TestMembershipsV3");
  const testMembershipsV3: TestMembershipsV3 = <TestMembershipsV3>(
    await deployContract(deployer, testMembershipsV3Artifact, [membershipsMetadataRegistry])
  );
  return testMembershipsV3;
}
