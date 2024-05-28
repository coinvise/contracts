import dotenv from "dotenv";

dotenv.config();

export const TASK_DEPLOY_FWB_FEST: string = "deploy:FWB";
export const TASK_DEPLOY_ERC721: string = "deploy:erc721";
export const SUBTASK_DEPLOY_WAIT_FOR_CONFIRMATIONS: string = "deploy:wait-for-confirmations";
export const SUBTASK_DEPLOY_VERIFY: string = "deploy:verify";

export const TRUSTED_ADDRESS = process.env["TRUSTED_ADDRESS"];
export const FWB_FEST_TOKEN_ADDRESS = process.env["FWB_FEST_TOKEN_ADDRESS"];
export const CAMPAIGN_MANAGER = process.env["CAMPAIGN_MANAGER"];
export const CAMPAIGN_ID = parseInt(process.env["CAMPAIGN_ID"] ?? "1");
