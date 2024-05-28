import { BigNumber, BigNumberish, Signer } from "ethers";
import { ethers, upgrades } from "hardhat";
import { Campaigns, CampaignsNativeGaslessClaim } from "../../src/types/contracts/campaigns";
import { ProtocolRewards } from "../../src/types/contracts/protocol-rewards";
import { CampaignsNativeGaslessClaimV1 } from "../../src/types/contracts/test/CampaignsNativeGaslessClaimV1";
import { CampaignsV1 } from "../../src/types/contracts/test/CampaignsV1";
import { ERC20Token } from "../../src/types/contracts/test/ERC20Token";
import {
  CampaignsNativeGaslessClaim__factory,
  Campaigns__factory,
} from "../../src/types/factories/contracts/campaigns";
import { ProtocolRewards__factory } from "../../src/types/factories/contracts/protocol-rewards";
import { CampaignsV1__factory, ERC20Token__factory } from "../../src/types/factories/contracts/test";

export async function deployProtocolRewards(deployer: Signer): Promise<ProtocolRewards> {
  const protocolRewardsFactory: ProtocolRewards__factory = <ProtocolRewards__factory>(
    await ethers.getContractFactory("ProtocolRewards", deployer)
  );
  const protocolRewards: ProtocolRewards = <ProtocolRewards>await protocolRewardsFactory.connect(deployer).deploy();
  return protocolRewards;
}

export async function deployCampaigns(
  deployer: Signer,
  trustedAddress: string,
  claimFee: BigNumberish,
  protocolRewardsAddress: string,
): Promise<Campaigns> {
  const campaignsFactory: Campaigns__factory = <Campaigns__factory>(
    await ethers.getContractFactory("Campaigns", deployer) // https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/85#issuecomment-1028435049
  );
  const campaigns: Campaigns = <Campaigns>await upgrades.deployProxy(campaignsFactory, [trustedAddress, claimFee], {
    constructorArgs: [protocolRewardsAddress],
  });
  return campaigns;
}

export async function deployCampaignsV1(
  deployer: Signer,
  trustedAddress: string,
  claimFee: BigNumberish,
): Promise<CampaignsV1> {
  const campaignsFactory: CampaignsV1__factory = <CampaignsV1__factory>(
    await ethers.getContractFactory("CampaignsV1", deployer) // https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/85#issuecomment-1028435049
  );
  const campaigns: CampaignsV1 = <CampaignsV1>await upgrades.deployProxy(campaignsFactory, [trustedAddress, claimFee]);
  // const campaigns: CampaignsV1 = <CampaignsV1>await campaignsFactory.connect(deployer).deploy(trustedAddress, claimFee);
  return campaigns;
}

export async function deployCampaignsNativeGaslessClaim(
  deployer: Signer,
  trustedAddress: string,
  claimFee: BigNumberish,
  protocolRewardsAddress: string,
): Promise<CampaignsNativeGaslessClaim> {
  const campaignsFactory: CampaignsNativeGaslessClaim__factory = <CampaignsNativeGaslessClaim__factory>(
    await ethers.getContractFactory("CampaignsNativeGaslessClaim", deployer) // https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/85#issuecomment-1028435049
  );
  const campaignsNativeGaslessClaim: CampaignsNativeGaslessClaim = <CampaignsNativeGaslessClaim>(
    await upgrades.deployProxy(campaignsFactory, [trustedAddress, claimFee], {
      constructorArgs: [protocolRewardsAddress],
    })
  );
  // const campaignsNativeGaslessClaim: CampaignsNativeGaslessClaim = <CampaignsNativeGaslessClaim>await campaignsFactory.connect(deployer).deploy(trustedAddress, claimFee);
  return campaignsNativeGaslessClaim;
}

export async function deployCampaignsNativeGaslessClaimV1(
  deployer: Signer,
  trustedAddress: string,
  claimFee: BigNumberish,
): Promise<CampaignsNativeGaslessClaimV1> {
  const campaignsFactory: CampaignsNativeGaslessClaim__factory = <CampaignsNativeGaslessClaim__factory>(
    await ethers.getContractFactory("CampaignsNativeGaslessClaimV1", deployer) // https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/85#issuecomment-1028435049
  );
  const campaignsNativeGaslessClaim: CampaignsNativeGaslessClaimV1 = <CampaignsNativeGaslessClaimV1>(
    await upgrades.deployProxy(campaignsFactory, [trustedAddress, claimFee])
  );
  return campaignsNativeGaslessClaim;
}

export async function deployERC20Token(
  deployer: Signer,
  name: string,
  symbol: string,
  decimals: BigNumber,
): Promise<ERC20Token> {
  const erc20TokenFactory: ERC20Token__factory = <ERC20Token__factory>await ethers.getContractFactory("ERC20Token");
  const erc20Token: ERC20Token = <ERC20Token>await erc20TokenFactory.connect(deployer).deploy(name, symbol, decimals);
  return erc20Token;
}
