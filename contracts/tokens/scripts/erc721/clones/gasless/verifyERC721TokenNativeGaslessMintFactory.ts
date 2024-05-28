import hre from "hardhat";
import config from "../../../../config/config.json";
import { MINT_FEE_RECIPIENT } from "../../../../test/test-utils";
import {
  getCampaignMintFee,
  getCampaignSponsoredMintFee,
} from "../../../utils";
import { getOrDeployProtocolRewards } from "../deployImplScripts";

type Config = (typeof config)["mainnet"];

// const get

const main = async () => {
  const network = hre.network.name;
  if (!network) throw new Error("Invalid network");
  const networkConfig = (config as any)[network] as Config;
  if (!networkConfig) throw new Error(`Invalid network: ${network}`);

  const _erc721TokenImpl = networkConfig.ERC721TokenImpl.address;
  const _erc721SoulboundTokenImpl =
    networkConfig.ERC721SoulboundTokenImpl.address;
  const _erc721TokenNativeGaslessMintImpl =
    networkConfig.ERC721TokenNativeGaslessMintImpl.address;
  const _erc721SoulboundTokenNativeGaslessMintImpl =
    networkConfig.ERC721SoulboundTokenNativeGaslessMintImpl.address;

  const protocolRewards = await getOrDeployProtocolRewards();

  const result = await Promise.allSettled([
    await hre.run("verify:verify", {
      address: _erc721TokenImpl,
      constructorArguments: [
        getCampaignMintFee(hre.network.config.chainId!),
        getCampaignSponsoredMintFee(hre.network.config.chainId!),
        MINT_FEE_RECIPIENT,
        protocolRewards,
      ],
    }),
    await hre.run("verify:verify", {
      address: _erc721SoulboundTokenImpl,
      constructorArguments: [
        getCampaignMintFee(hre.network.config.chainId!),
        getCampaignSponsoredMintFee(hre.network.config.chainId!),
        MINT_FEE_RECIPIENT,
        protocolRewards,
      ],
    }),
    await hre.run("verify:verify", {
      address: _erc721TokenNativeGaslessMintImpl,
      constructorArguments: [],
    }),
    await hre.run("verify:verify", {
      address: _erc721SoulboundTokenNativeGaslessMintImpl,
      constructorArguments: [],
    }),

    await hre.run("verify:verify", {
      address: networkConfig.ERC721TokenNativeGaslessMintFactory.address,
      constructorArguments: [
        _erc721TokenImpl,
        _erc721SoulboundTokenImpl,
        _erc721TokenNativeGaslessMintImpl,
        _erc721SoulboundTokenNativeGaslessMintImpl,
      ],
    }),
  ]);

  console.log(result);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
