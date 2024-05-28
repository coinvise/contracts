import { Chain } from "@coinvise/chain";
import { config as dotenvConfig } from "dotenv";
import { BigNumber, ethers } from "ethers";
import { resolve } from "path";
dotenvConfig({ path: resolve(__dirname, "../.env") });

export const ERC20_TOKEN_DECIMALS = BigNumber.from("18");
export const ERC20_TOKEN_NAME = "ERC20Token";
export const ERC20_TOKEN_SYMBOL = "ERC20T";

export const ETHAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const TRUSTED_ADDRESS = process.env.TRUSTED_ADDRESS ?? "";
export const TRUSTED_ADDRESS_PRIVATE_KEY = process.env.TRUSTED_ADDRESS_PRIVATE_KEY ?? "";

export const getCampaignClaimFee = (networkId: number): BigNumber => {
  const chain = new Chain(networkId);
  if (
    chain.isEthereum() ||
    chain.isOptimism() ||
    chain.isBase() ||
    chain.isArbitrum() ||
    chain.isLinea() ||
    chain.isScroll() ||
    chain.isMorph() ||
    chain.isZircuit()
  ) {
    return ethers.utils.parseEther("0.0005");
  } else if (chain.isPolygon()) {
    return ethers.utils.parseEther("0.88");
  } else if (chain.isNeonEVM()) {
    return ethers.utils.parseEther("1");
  } else {
    throw new Error("Invalid network");
  }
};

export const getCampaignSponsoredClaimFee = (networkId: number): BigNumber => {
  const chain = new Chain(networkId);
  if (
    chain.isEthereum() ||
    chain.isOptimism() ||
    chain.isBase() ||
    chain.isArbitrum() ||
    chain.isLinea() ||
    chain.isScroll() ||
    chain.isMorph() ||
    chain.isZircuit()
  ) {
    return ethers.utils.parseEther("0.00025");
  } else if (chain.isPolygon()) {
    return ethers.utils.parseEther("0.75");
  } else if (chain.isNeonEVM()) {
    return ethers.utils.parseEther("0.55");
  } else {
    throw new Error("Invalid network");
  }
};
