import { expect } from "chai";
import { BigNumberish, Contract, Signer } from "ethers";
import { ethers } from "hardhat";
import { ERC1155Token } from "../../../src/types/ERC1155Token";
import { ERC20Token } from "../../../src/types/ERC20Token";
import { ERC721Token } from "../../../src/types/ERC721Token";
import { NFTAirDrop } from "../../../src/types/NFTAirDrop";
import { integrationFixture } from "../../shared/fixtures";
import { TokenType } from "../../shared/types";

export function intergrationTestNFTAirDrop(): void {
  describe("NFTAirDrop", () => {
    let erc20: ERC20Token;
    let erc721: ERC721Token;
    let erc1155: ERC1155Token;
    let airDrop: NFTAirDrop;
    let tokenOwner: Signer;
    let recipientsAddresses: string[];
    let tokenIDs: BigNumberish[];
    let amounts: BigNumberish[];

    async function getMultiSendTx(contract: Contract, tokenType: TokenType) {
      const connection = airDrop.connect(tokenOwner);
      if (tokenType === TokenType.ERC721) {
        return await connection.multiSendERC721(contract.address, recipientsAddresses, tokenIDs);
      }

      return await connection.multiSendERC1155(contract.address, recipientsAddresses, tokenIDs, amounts);
    }

    async function multiSend(contract: Contract, tokenType: TokenType) {
      return (await getMultiSendTx(contract, tokenType)).wait();
    }

    beforeEach(async function () {
      ({ erc20, erc721, erc1155, airDrop, tokenOwner, recipientsAddresses, tokenIDs, amounts } = await this.loadFixture(
        integrationFixture,
      ));
    });

    describe("multiSendERC721", () => {
      it("should send NFTs to recipients", async () => {
        await multiSend(erc721, TokenType.ERC721);

        await Promise.all(
          recipientsAddresses.map((recipientAddress, index) =>
            erc721
              .ownerOf(tokenIDs[index])
              .then(nftHolderAddress => expect(nftHolderAddress).to.equal(recipientAddress)),
          ),
        );
      });

      it("should revert when token does not have safeTransfer method", async function () {
        await expect(getMultiSendTx(erc20, TokenType.ERC721)).to.be.revertedWith(
          "function selector was not recognized and there's no fallback function",
        );
      });

      it("should revert when address length does not match token ID length", async function () {
        tokenIDs = tokenIDs.slice(0, tokenIDs.length - 1);

        await expect(getMultiSendTx(erc721, TokenType.ERC721)).to.be.revertedWith("LengthMismatch()");
      });

      it("should revert when recipients is an empty array", async function () {
        recipientsAddresses = [];
        tokenIDs = [];

        await expect(getMultiSendTx(erc721, TokenType.ERC721)).to.be.revertedWith("NoRecipients()");
      });

      it("should revert when an address is address zero", async function () {
        recipientsAddresses = [...recipientsAddresses];
        recipientsAddresses[recipientsAddresses.length - 1] = ethers.constants.AddressZero;

        await expect(getMultiSendTx(erc721, TokenType.ERC721)).to.be.revertedWith(
          "ERC721: transfer to the zero address",
        );
      });
    });

    describe("multiSendERC1155", function () {
      it("should send ERC1155 Token to recipients", async function () {
        await multiSend(erc1155, TokenType.ERC1155);

        await Promise.all(
          recipientsAddresses.map((_, index) =>
            erc1155.balanceOf(recipientsAddresses[index], tokenIDs[index]).then(tokenBalance => {
              expect(tokenBalance).to.be.equal(amounts[index]);
            }),
          ),
        );
      });

      it("should revert when token does not have safeTransfer method", async function () {
        await expect(getMultiSendTx(erc20, TokenType.ERC1155)).to.be.revertedWith(
          "function selector was not recognized and there's no fallback function",
        );
      });

      it("should revert when address length does not match token ID length", async function () {
        tokenIDs = tokenIDs.slice(0, tokenIDs.length - 1);

        await expect(getMultiSendTx(erc1155, TokenType.ERC1155)).to.be.revertedWith("LengthMismatch()");
      });

      it("should revert when recipients length does not match amounts length", async function () {
        amounts = amounts.slice(0, amounts.length - 1);

        await expect(getMultiSendTx(erc1155, TokenType.ERC1155)).to.be.revertedWith("LengthMismatch()");
      });

      it("should revert when recipients is an empty array", async function () {
        recipientsAddresses = [];
        amounts = [];
        tokenIDs = [];

        await expect(getMultiSendTx(erc1155, TokenType.ERC1155)).to.be.revertedWith("NoRecipients()");
      });

      it("should revert when a recipient is address zero", async function () {
        recipientsAddresses = [...recipientsAddresses];
        recipientsAddresses[recipientsAddresses.length - 1] = ethers.constants.AddressZero;

        await expect(getMultiSendTx(erc1155, TokenType.ERC1155)).to.be.revertedWith(
          "ERC1155: transfer to the zero address",
        );
      });
    });
  });
}
