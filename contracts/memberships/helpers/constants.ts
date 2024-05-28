import { BigNumber } from "ethers";

export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const ERC20_TOKEN_DECIMALS = BigNumber.from("18");
export const ERC20_TOKEN_NAME = "ERC20Token";
export const ERC20_TOKEN_SYMBOL = "ERC20T";

export const FEE_BPS = 250; // 2.5% = 250 bps
export const FEE_TREASURY = "0x8FD79784284b21Aa4bA18e0e2093cebDf354fe19"; // Coinvise Multisig

export const MEMBERSHIPS_NAME = "Sample Membership Tier I";
export const MEMBERSHIPS_SYMBOL = "SAMPLE_MEMBERSHIP_I";
export const MEMBERSHIPS_DESCRIPTION =
  "Sample Membership Tier I that gives Tier I benefits for holders in the Sample DAO";
export const MEMBERSHIPS_IMAGE_URI = "ipfs://bafybeibuewxhuv65pge6qsi7ytes22cm727qxiip3pgps7fbxsxradq474";
export const MEMBERSHIPS_ANIMATION_URI = "";

export const MEMBERSHIPS_EXTERNAL_LINK_URL = "https://memberships.coinvise.co/memberships"; // Has to be a valid URL
export const MEMBERSHIPS_ROYALTY_FEE_BPS = 1000; // 10%

// Invalid IPFS CIDs for tests
export const MEMBERSHIPS_CONTRACT_URI = "ipfs://bafkreichqe4hv4yrk6bbyauvkmqp7shulrqswijf2qkyzomotpbttpfdyq";
export const MEMBERSHIPS_BASE_URI = "ipfs://bafybeihtvsttul3zfsyna622ndtceg44k5lgersdpljzffusathvr343yi/";

export const MEMBERSHIPS_CAP = 10;

export const MEMBERSHIPS_IMAGE_PATH = "./helpers/metadata/image.gif";
export const MEMBERSHIPS_IMAGE_NAME = "image.gif";
export const MEMBERSHIPS_IMAGE_TYPE = "image/gif";
// export const MEMBERSHIPS_IMAGE_PATH = "./helpers/metadata/image.png";
// export const MEMBERSHIPS_IMAGE_NAME = "image.png";
// export const MEMBERSHIPS_IMAGE_TYPE = "image/png";

export const SECONDS_PER_DAY = 86400;
