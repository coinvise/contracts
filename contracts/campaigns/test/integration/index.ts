import { baseContext } from "../shared/contexts";
import { integrationTestCampaigns } from "./campaigns/Campaigns.test";
import { integrationTestCampaignsNativeGaslessClaim } from "./campaigns/CampaignsNativeGaslessClaim.test";

baseContext("Integration Tests", function () {
  integrationTestCampaigns();
  integrationTestCampaignsNativeGaslessClaim();
});
