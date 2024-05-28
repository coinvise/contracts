import { baseContext } from "../shared/contexts";
import { integrationTestMemberships } from "./memberships/Memberships.test";
import { integrationTestMembershipsFactory } from "./memberships/MembershipsFactory.test";
import { integrationTestMembershipsProxy } from "./memberships/MembershipsProxy.test";

baseContext("Integration Tests", function () {
  integrationTestMemberships();
  integrationTestMembershipsFactory();
  integrationTestMembershipsProxy();
});
