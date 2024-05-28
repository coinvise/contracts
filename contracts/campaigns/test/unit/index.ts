import { baseContext } from "../shared/contexts";
import { unitTestCampaigns } from "./campaigns/Campaigns.test";
import { unitTestCampaignsNativeGaslessClaim } from "./campaigns/CampaignsNativeGaslessClaim.test";

baseContext("Unit Tests", function () {
  unitTestCampaigns();
  unitTestCampaignsNativeGaslessClaim();
});
