import { baseContext } from "../shared/contexts";
import { unitTestFWBFest } from "./FWBFestAttendanceNFT/FWBFestAttendanceNFT.test";

baseContext("Unit Tests", function () {
  unitTestFWBFest();
});
