import type { MockContract } from "@ethereum-waffle/mock-contract";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";
import { ERC20_TOKEN_DECIMALS, ERC20_TOKEN_NAME, ERC20_TOKEN_SYMBOL } from "../../helpers/constants";
import { Campaigns, CampaignsNativeGaslessClaim } from "../../src/types/contracts/campaigns";
import { ProtocolRewards } from "../../src/types/contracts/protocol-rewards";
import { CampaignsNativeGaslessClaimV1 } from "../../src/types/contracts/test/CampaignsNativeGaslessClaimV1";
import { CampaignsV1 } from "../../src/types/contracts/test/CampaignsV1";
import { ERC20Token } from "../../src/types/contracts/test/ERC20Token";
import {
  deployCampaigns,
  deployCampaignsNativeGaslessClaim,
  deployCampaignsNativeGaslessClaimV1,
  deployCampaignsV1,
  deployERC20Token,
  deployProtocolRewards,
} from "./deployers";
import { deployMockERC20Token, deployMockProtocolRewards } from "./mocks";
import { CLAIM_FEE } from "./utils";

/* Campaigns */

type IntegrationFixtureCampaignsReturnType = {
  campaigns: Campaigns;
  erc20Token: ERC20Token;
  protocolRewards: ProtocolRewards;
};

export async function integrationFixtureCampaigns(): Promise<IntegrationFixtureCampaignsReturnType> {
  const signers: SignerWithAddress[] = await ethers.getSigners();
  const deployer: SignerWithAddress = signers[0];
  const trustedAddressSigner: SignerWithAddress = signers[signers.length - 1];
  const trustedAddress = await trustedAddressSigner.getAddress();
  const treasury = signers[signers.length - 3];

  const erc20Token: ERC20Token = await deployERC20Token(
    deployer,
    ERC20_TOKEN_NAME,
    ERC20_TOKEN_SYMBOL,
    ERC20_TOKEN_DECIMALS,
  );
  const protocolRewards: ProtocolRewards = await deployProtocolRewards(deployer);
  const campaigns: Campaigns = await deployCampaigns(deployer, trustedAddress, CLAIM_FEE, protocolRewards.address);
  await campaigns.connect(deployer).setTreasury(treasury.address);
  return { campaigns, erc20Token, protocolRewards };
}

type UnitFixtureCampaignsReturnType = {
  campaigns: Campaigns;
  erc20Token: MockContract;
  protocolRewards: MockContract;
};

export async function unitFixtureCampaigns(): Promise<UnitFixtureCampaignsReturnType> {
  const signers: SignerWithAddress[] = await ethers.getSigners();
  const deployer: SignerWithAddress = signers[0];
  const trustedAddressSigner: SignerWithAddress = signers[signers.length - 1];
  const trustedAddress = await trustedAddressSigner.getAddress();
  const treasury = signers[signers.length - 3];

  const erc20Token: MockContract = await deployMockERC20Token(
    deployer,
    ERC20_TOKEN_NAME,
    ERC20_TOKEN_SYMBOL,
    ERC20_TOKEN_DECIMALS,
  );
  const protocolRewards: MockContract = await deployMockProtocolRewards(deployer);
  const campaigns: Campaigns = await deployCampaigns(deployer, trustedAddress, CLAIM_FEE, protocolRewards.address);
  await campaigns.connect(deployer).setTreasury(treasury.address);
  return { campaigns, erc20Token, protocolRewards };
}

/* CampaignsNativeGaslessClaim */

type IntegrationFixtureCampaignsNativeGaslessClaimReturnType = {
  campaignsNativeGaslessClaim: CampaignsNativeGaslessClaim;
  erc20Token: ERC20Token;
  protocolRewards: ProtocolRewards;
};

export async function integrationFixtureCampaignsNativeGaslessClaim(): Promise<IntegrationFixtureCampaignsNativeGaslessClaimReturnType> {
  const signers: SignerWithAddress[] = await ethers.getSigners();
  const deployer: SignerWithAddress = signers[0];
  const trustedAddressSigner: SignerWithAddress = signers[signers.length - 1];
  const trustedAddress = await trustedAddressSigner.getAddress();
  const treasury = signers[signers.length - 3];

  const erc20Token: ERC20Token = await deployERC20Token(
    deployer,
    ERC20_TOKEN_NAME,
    ERC20_TOKEN_SYMBOL,
    ERC20_TOKEN_DECIMALS,
  );
  const protocolRewards: ProtocolRewards = await deployProtocolRewards(deployer);
  const campaignsNativeGaslessClaim: CampaignsNativeGaslessClaim = await deployCampaignsNativeGaslessClaim(
    deployer,
    trustedAddress,
    CLAIM_FEE,
    protocolRewards.address,
  );
  await campaignsNativeGaslessClaim.connect(deployer).setTreasury(treasury.address);
  return { campaignsNativeGaslessClaim, erc20Token, protocolRewards };
}

type UnitFixtureCampaignsNativeGaslessClaimReturnType = {
  campaignsNativeGaslessClaim: CampaignsNativeGaslessClaim;
  erc20Token: MockContract;
  protocolRewards: MockContract;
};

export async function unitFixtureCampaignsNativeGaslessClaim(): Promise<UnitFixtureCampaignsNativeGaslessClaimReturnType> {
  const signers: SignerWithAddress[] = await ethers.getSigners();
  const deployer: SignerWithAddress = signers[0];
  const trustedAddressSigner: SignerWithAddress = signers[signers.length - 1];
  const trustedAddress = await trustedAddressSigner.getAddress();
  const treasury = signers[signers.length - 3];

  const erc20Token: MockContract = await deployMockERC20Token(
    deployer,
    ERC20_TOKEN_NAME,
    ERC20_TOKEN_SYMBOL,
    ERC20_TOKEN_DECIMALS,
  );
  const protocolRewards: MockContract = await deployMockProtocolRewards(deployer);
  const campaignsNativeGaslessClaim: CampaignsNativeGaslessClaim = await deployCampaignsNativeGaslessClaim(
    deployer,
    trustedAddress,
    CLAIM_FEE,
    protocolRewards.address,
  );
  await campaignsNativeGaslessClaim.connect(deployer).setTreasury(treasury.address);
  return { campaignsNativeGaslessClaim, erc20Token, protocolRewards };
}

type UpgradeFixtureCampaignsReturnType = {
  campaignsV1: CampaignsV1;
  erc20Token: ERC20Token;
  protocolRewards: ProtocolRewards;
};

export async function upgradeFixtureCampaignsV1(): Promise<UpgradeFixtureCampaignsReturnType> {
  const signers: SignerWithAddress[] = await ethers.getSigners();
  const deployer: SignerWithAddress = signers[0];
  const trustedAddressSigner: SignerWithAddress = signers[signers.length - 1];
  const trustedAddress = await trustedAddressSigner.getAddress();

  const erc20Token: ERC20Token = await deployERC20Token(
    deployer,
    ERC20_TOKEN_NAME,
    ERC20_TOKEN_SYMBOL,
    ERC20_TOKEN_DECIMALS,
  );
  const campaignsV1: CampaignsV1 = await deployCampaignsV1(deployer, trustedAddress, CLAIM_FEE);
  const protocolRewards: ProtocolRewards = await deployProtocolRewards(deployer);
  return { campaignsV1, erc20Token, protocolRewards };
}

type UpgradeFixtureCampaignsNativeGaslessClaimReturnType = {
  campaignsNativeGaslessClaimV1: CampaignsNativeGaslessClaimV1;
  erc20Token: ERC20Token;
  protocolRewards: ProtocolRewards;
};

export async function upgradeFixtureCampaignsNativeGaslessClaimV1(): Promise<UpgradeFixtureCampaignsNativeGaslessClaimReturnType> {
  const signers: SignerWithAddress[] = await ethers.getSigners();
  const deployer: SignerWithAddress = signers[0];
  const trustedAddressSigner: SignerWithAddress = signers[signers.length - 1];
  const trustedAddress = await trustedAddressSigner.getAddress();

  const erc20Token: ERC20Token = await deployERC20Token(
    deployer,
    ERC20_TOKEN_NAME,
    ERC20_TOKEN_SYMBOL,
    ERC20_TOKEN_DECIMALS,
  );
  const campaignsNativeGaslessClaimV1: CampaignsNativeGaslessClaimV1 = await deployCampaignsNativeGaslessClaimV1(
    deployer,
    trustedAddress,
    CLAIM_FEE,
  );
  const protocolRewards = await deployProtocolRewards(deployer);
  return { campaignsNativeGaslessClaimV1, erc20Token, protocolRewards };
}
