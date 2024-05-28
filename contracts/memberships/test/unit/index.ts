import { baseContext } from "../shared/contexts";
import { unitTestMembershipsMetadataRegistry } from "./memberships/MembershipsMetadataRegistry.test";
import { unitTestMemberships } from "./memberships/Memberships.test";
import { unitTestMembershipsFactory } from "./memberships/MembershipsFactory.test";

baseContext("Unit Tests", function () {
  unitTestMembershipsMetadataRegistry();
  unitTestMemberships();
  unitTestMembershipsFactory();
});
