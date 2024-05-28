import hre from "hardhat";
import config from "../../../config/config.json";
import { getCampaignCreationFee } from "../../utils";

type Config = (typeof config)["mainnet"];

const main = async () => {
  const network = hre.network.name;
  if (!network) throw new Error("Invalid network");
  const networkConfig = (config as any)[network] as Config;
  if (!networkConfig) throw new Error(`Invalid network: ${network}`);

  const _erc721TokenImpl = networkConfig.ERC721TokenImpl.address;
  const _erc721SoulboundTokenImpl =
    networkConfig.ERC721SoulboundTokenImpl.address;

  const _fee = getCampaignCreationFee(hre.network.config.chainId!);

  const result = await Promise.allSettled([
    await hre.run("verify:verify", {
      address: _erc721TokenImpl,
      constructorArguments: [],
    }),
    await hre.run("verify:verify", {
      address: _erc721SoulboundTokenImpl,
      constructorArguments: [],
    }),
    await hre.run("verify:verify", {
      address: networkConfig.ERC721TokenFactory.address,
      constructorArguments: [_erc721TokenImpl, _erc721SoulboundTokenImpl, _fee],
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
