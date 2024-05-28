import type { Fixture } from "ethereum-waffle";

export enum TokenType {
  ERC721 = 721,
  ERC1155 = 1155,
}

declare module "mocha" {
  interface Context {
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
  }
}
