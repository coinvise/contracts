import { baseContext } from "../shared/contexts";
import { intergrationTestNFTAirDrop } from "./nft-airdrop/NFTAirDrop.test";

baseContext("Integration Tests", function () {
  intergrationTestNFTAirDrop();
});
