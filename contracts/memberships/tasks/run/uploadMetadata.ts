import { subtask, task, types } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import { File, NFTStorage } from "nft.storage";
import fs from "fs";
import {
  MEMBERSHIPS_ANIMATION_URI,
  MEMBERSHIPS_CAP,
  MEMBERSHIPS_DESCRIPTION,
  MEMBERSHIPS_EXTERNAL_LINK_URL,
  MEMBERSHIPS_IMAGE_NAME,
  MEMBERSHIPS_IMAGE_PATH,
  MEMBERSHIPS_IMAGE_TYPE,
  MEMBERSHIPS_NAME,
  MEMBERSHIPS_ROYALTY_FEE_BPS,
} from "../../helpers/constants";
import { getEnvVar } from "../../helpers/env";
import {
  SUBTASK_RUN_UPLOAD_FILE_NFT_STORAGE,
  TASK_RUN_UPLOAD_CONTRACT_METADATA_NFT_STORAGE,
  TASK_RUN_UPLOAD_TOKEN_METADATA_NFT_STORAGE,
} from "../constants";

subtask(SUBTASK_RUN_UPLOAD_FILE_NFT_STORAGE)
  .addParam("filePath", "Relative path of file to upload")
  .addParam("fileName", "Name of file to upload")
  .addParam("fileType", "MIME type of file to upload")
  .setAction(async function (taskArguments: TaskArguments) {
    const NFT_STORAGE_TOKEN: string = getEnvVar("NFT_STORAGE_TOKEN");
    const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

    const file = new File([await fs.promises.readFile(taskArguments.filePath)], taskArguments.filePath, {
      type: taskArguments.fileType,
    });
    const fileCID = await client.storeBlob(file);
    console.log("File uploaded to: ", `ipfs://${fileCID}`);
    return fileCID;
  });

task(TASK_RUN_UPLOAD_CONTRACT_METADATA_NFT_STORAGE)
  .addParam("name", "Name for Membership", MEMBERSHIPS_NAME, types.string)
  .addParam("description", "Description for Membership", MEMBERSHIPS_DESCRIPTION, types.string)
  .addOptionalParam("imageUri", "Image URI for Membership")
  .addParam("externalLinkUrl", "External Link URL for Membership", MEMBERSHIPS_EXTERNAL_LINK_URL, types.string)
  .addParam("sellerFeeBasisPoints", "Royalty fee in BPS", MEMBERSHIPS_ROYALTY_FEE_BPS, types.int)
  .addOptionalParam("feeRecipient", "Royalty fee recipient")
  .setAction(async function (taskArguments: TaskArguments, { ethers, run }) {
    const NFT_STORAGE_TOKEN: string = getEnvVar("NFT_STORAGE_TOKEN");
    const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

    const [executor] = await ethers.getSigners();

    // Upload image if `imageUri` not provided
    if (!taskArguments.imageUri) {
      console.log("Note: imageUri was not provided. Hence uploading default image to IPFS");

      const fileCID = await run(SUBTASK_RUN_UPLOAD_FILE_NFT_STORAGE, {
        filePath: MEMBERSHIPS_IMAGE_PATH,
        fileName: MEMBERSHIPS_IMAGE_NAME,
        fileType: MEMBERSHIPS_IMAGE_TYPE,
      });
      taskArguments.imageUri = `ipfs://${fileCID}`;

      console.log("Image uploaded to: ", taskArguments.imageUri);
    }

    // Set `feeRecipient` to executor if not provider
    if (!taskArguments.feeRecipient) {
      taskArguments.feeRecipient = executor.address;
      console.log("feeRecipient: ", taskArguments.feeRecipient);
    }

    // Refer: https://docs.opensea.io/docs/contract-level-metadata
    const metadata = {
      name: taskArguments.name,
      description: taskArguments.description,
      image: taskArguments.imageUri, // Collection image on OpenSea collection page
      external_link: taskArguments.externalLinkUrl, // This has to be a valid URL to show up on OpenSea
      seller_fee_basis_points: taskArguments.sellerFeeBasisPoints, // Shows up on the "Creator Fees" section of each token on OpenSea
      fee_recipient: taskArguments.feeRecipient, // Default configured as the OpenSea royalty fee collector address
    };

    const file = new File([JSON.stringify(metadata)], "metadata.json", { type: "application/json" });
    const fileCID = await client.storeBlob(file);

    console.log("Contract metadata uploaded to: ", `ipfs://${fileCID}`);

    return fileCID;
  });

task(TASK_RUN_UPLOAD_TOKEN_METADATA_NFT_STORAGE)
  .addParam("name", "Name for Membership", MEMBERSHIPS_NAME, types.string)
  .addParam("description", "Description for Membership", MEMBERSHIPS_DESCRIPTION, types.string)
  .addParam("animationUrl", "animation_url for Membership", MEMBERSHIPS_ANIMATION_URI, types.string)
  .addOptionalParam("imageUri", "Image URI for Membership")
  .addParam("count", "Number of tokens", MEMBERSHIPS_CAP, types.int)
  .setAction(async function (taskArguments: TaskArguments, { run }) {
    const NFT_STORAGE_TOKEN: string = getEnvVar("NFT_STORAGE_TOKEN");
    const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

    // Upload image if `imageUri` not provided
    if (!taskArguments.imageUri) {
      console.log("Note: imageUri was not provided. Hence uploading default image to IPFS");

      const fileCID = await run(SUBTASK_RUN_UPLOAD_FILE_NFT_STORAGE, {
        filePath: MEMBERSHIPS_IMAGE_PATH,
        fileName: MEMBERSHIPS_IMAGE_NAME,
        fileType: MEMBERSHIPS_IMAGE_TYPE,
      });
      taskArguments.imageUri = `ipfs://${fileCID}`;

      console.log("Image uploaded to: ", taskArguments.imageUri);
    }

    const files = [...Array(taskArguments.count).keys()].map(index => {
      const tokenId = index + 1;
      // Refer: https://docs.opensea.io/docs/metadata-standards
      const metadata = {
        name: `${taskArguments.name} #${tokenId}`,
        description: taskArguments.description,
        animation_url: taskArguments.animationUrl,
        image: taskArguments.imageUri,
        attributes: [
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
        ],
      };
      return new File([JSON.stringify(metadata)], tokenId.toString(), { type: "application/json" });
    });

    const folderCID = await client.storeDirectory(files);

    console.log(`Uploaded ${taskArguments.count} tokens' metadata to: ipfs://${folderCID}/`);

    return folderCID;
  });
