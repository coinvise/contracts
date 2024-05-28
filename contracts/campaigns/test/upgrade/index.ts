import { baseContext } from "../shared/contexts";
import { upgradeTestCampaigns } from "../upgrade/Campaigns.test";
import { upgradeTestCampaignsNativeGaslessClaim } from "./CampaignsNativeGaslessClaim.test";

baseContext("Upgrade Tests", function () {
  upgradeTestCampaigns();
  upgradeTestCampaignsNativeGaslessClaim();
});
