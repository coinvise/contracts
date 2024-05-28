import { NFTAirDrop } from "../../src/types/NFTAirDrop";
import { ERC20Token } from "../../src/types/ERC20Token";
import { ERC721Token } from "../../src/types/ERC721Token";
import { ERC1155Token } from "../../src/types/ERC1155Token";
import { deployToken } from "./deployers";
import { BigNumberish, Signer } from "ethers";

type IntegrationFixtureReturnType = {
  erc20: ERC20Token;
  erc721: ERC721Token;
  erc1155: ERC1155Token;
  airDrop: NFTAirDrop;
  tokenOwner: Signer;
  recipientsAddresses: string[];
  tokenIDs: BigNumberish[];
  amounts: BigNumberish[];
};

export async function integrationFixture(signers: Signer[]): Promise<IntegrationFixtureReturnType> {
  const [deployer1, deployer2, deployer3, deployer4, tokenOwner, ...otherSigners] = signers;

  const [airDrop, erc721, erc1155, erc20] = await Promise.all([
    deployToken<NFTAirDrop>(deployer1, "NFTAirDrop"),
    deployToken<ERC721Token>(deployer2, "ERC721Token"),
    deployToken<ERC1155Token>(deployer3, "ERC1155Token"),
    deployToken<ERC20Token>(deployer4, "ERC20Token"),
  ]);

  const recipients = otherSigners;
  const recipientsLength = recipients.length;

  console.log(`Recipients length: ${recipientsLength}`);

  const recipientsAddresses = await Promise.all(recipients.map(recipient => recipient.getAddress()));

  // tokenIDs: [1, 2, 3]
  const tokenIDs = Array(recipientsLength)
    .fill(null)
    .map((_, index) => index + 1);

  // amounts: [1, 3, 5]
  const amounts = Array(recipientsLength)
    .fill(null)
    .map((_, index) => 2 * index + 1);

  const ownerAddress = await tokenOwner.getAddress();

  // mint {@recipientsLength} NFTs to {@link tokenOwner}
  await Promise.all(tokenIDs.map(() => erc721.connect(tokenOwner).mint()));

  console.log(`Mint ${tokenIDs.length} NFTs to ${ownerAddress}`);

  await Promise.all(amounts.map(amount => erc1155.connect(tokenOwner).mint(amount)));

  console.log(`Mint ERC721 tokens to ${ownerAddress}`);

  // approve airDrop smart contract to manage tokenOwner's assets
  await Promise.all([
    (await erc721.connect(tokenOwner).setApprovalForAll(airDrop.address, true)).wait(),
    (await erc1155.connect(tokenOwner).setApprovalForAll(airDrop.address, true)).wait(),
  ]);

  await (await erc721.connect(tokenOwner).setApprovalForAll(airDrop.address, true)).wait();
  console.log("Set approval for all true");

  return {
    erc20,
    erc721,
    erc1155,
    airDrop,
    recipientsAddresses,
    tokenIDs,
    tokenOwner,
    amounts,
  };
}
