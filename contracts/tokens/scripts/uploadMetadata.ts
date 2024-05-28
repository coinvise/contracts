import * as dotenv from "dotenv";
import fs from "fs";
import { ethers } from "hardhat";
import { File, NFTStorage } from "nft.storage";
dotenv.config();

const NFT_STORAGE_TOKEN = getEnvVar("NFT_STORAGE_TOKEN");

export const NFT_IMAGE_PATH = "./scripts/metadata/image.gif";
export const NFT_IMAGE_TYPE = "image/gif";

export interface uploadMetadataInput {
  name: string;
  symbol: string;
  description: string;
  externalLinkUrl: string;
  animationUrl: string;
  sellerFeeBasisPoints: number;
  feeRecipient: string;
  trustedAddress: string;
  maxSupply: number;
}

export const uploadFile = async (filePath: string, fileType: string) => {
  const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

  const file = new File([await fs.promises.readFile(filePath)], filePath, {
    type: fileType,
  });
  const fileCID = await client.storeBlob(file);
  console.log("File uploaded to: ", `ipfs://${fileCID}`);
  return fileCID;
};

export const uploadContractMetadata = async (
  name: string,
  description: string,
  imageUri: string,
  externalLinkUrl: string,
  sellerFeeBasisPoints: number,
  feeRecipient: string
) => {
  const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

  const [executor] = await ethers.getSigners();

  // Upload image if `imageUri` not provided
  if (!imageUri) {
    console.log(
      "Note: imageUri was not provided. Hence uploading default image to IPFS"
    );

    const fileCID = await uploadFile(NFT_IMAGE_PATH, NFT_IMAGE_TYPE);
    imageUri = `ipfs://${fileCID}`;

    console.log("Image uploaded to: ", imageUri);
  }

  // Set `feeRecipient` to executor if not provider
  if (!feeRecipient) {
    feeRecipient = executor.address;
    console.log("feeRecipient: ", feeRecipient);
  }

  // Refer: https://docs.opensea.io/docs/contract-level-metadata
  const metadata = {
    name: name,
    description: description,
    image: imageUri, // Collection image on OpenSea collection page
    external_link: externalLinkUrl, // This has to be a valid URL to show up on OpenSea
    seller_fee_basis_points: sellerFeeBasisPoints, // Shows up on the "Creator Fees" section of each token on OpenSea
    fee_recipient: feeRecipient, // Default configured as the OpenSea royalty fee collector address
  };

  const file = new File([JSON.stringify(metadata)], "metadata.json", {
    type: "application/json",
  });
  const fileCID = await client.storeBlob(file);

  console.log("Contract metadata uploaded to: ", `ipfs://${fileCID}`);

  return fileCID;
};

export const uploadTokenMetadata = async (
  name: string,
  description: string,
  animationUrl: string,
  imageUri: string
) => {
  const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

  // Upload image if `imageUri` not provided
  if (!imageUri) {
    console.log(
      "Note: imageUri was not provided. Hence uploading default image to IPFS"
    );

    const fileCID = await uploadFile(NFT_IMAGE_PATH, NFT_IMAGE_TYPE);
    imageUri = `ipfs://${fileCID}`;

    console.log("Image uploaded to: ", imageUri);
  }

  const metadata = {
    name: `${name}`,
    description: description,
    animation_url: animationUrl,
    image: imageUri,
    // no attributes for now
    /* attributes: [
        { trait_type: "Token", value: tokenId },
        {
          trait_type: "Benefit",
          value: "Benefit A",
        },
        {
          trait_type: "Benefit",
          value: "Benefit B",
        },
        {
          trait_type: "Benefit",
          value: "Benefit C",
        },
      ], */
  };

  const file = new File([JSON.stringify(metadata)], "metadata", {
    type: "application/json",
  });

  const fileCID = await client.storeBlob(file);
  console.log("File uploaded to: ", `ipfs://${fileCID}`);
  return fileCID;
};

export const uploadMetadata = async (input: uploadMetadataInput) => {
  console.log("Uploading metadata..");

  console.log("Uploading image..");
  const imageUri = `ipfs://${await uploadFile(NFT_IMAGE_PATH, NFT_IMAGE_TYPE)}`;

  console.log("Uploading contract metadata..");
  const contractURI = `ipfs://${await uploadContractMetadata(
    input.name,
    input.description,
    imageUri,
    input.externalLinkUrl,
    input.sellerFeeBasisPoints,
    input.feeRecipient
  )}`;

  console.log("Uploading tokens metadata..");
  const tokenURI = `ipfs://${await uploadTokenMetadata(
    input.name,
    input.description,
    input.animationUrl,
    imageUri
  )}`;

  return { contractURI, tokenURI };
};

export function getEnvVar(key: string): string {
  if (!process.env[key]) {
    throw new Error(`Please set ${key} as an env variable`);
  }
  return process.env[key] || "";
}
