import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import {
  ERC721Token,
  ERC721Token__factory,
  ReenterMint__factory,
} from "../../typechain/index";
import {
  ERC721_generateSignature,
  ZERO_ADDRESS,
  getEIP712TypedData,
} from "../test-utils";

describe("ERC721Token", () => {
  let ERC721: ERC721Token__factory;
  let erc721: ERC721Token;
  let owner: SignerWithAddress,
    trustedAddress: SignerWithAddress,
    user: SignerWithAddress,
    user2: SignerWithAddress;

  beforeEach(async () => {
    ERC721 = await ethers.getContractFactory("ERC721Token");
    [owner, trustedAddress, user, user2] = await ethers.getSigners();
    erc721 = await ERC721.deploy(
      "TestToken",
      "TEST",
      "https://example.com/contractURI",
      "https://example.com",
      trustedAddress.address,
      10
    );
  });

  it("should initialize with custom name and symbol", async () => {
    expect(await erc721.name()).to.eq("TestToken");
    expect(await erc721.symbol()).to.eq("TEST");
    expect(await erc721.maxSupply()).to.eq(10);
    expect(await erc721.contractURI()).to.eq("https://example.com/contractURI");
    expect(await erc721.tokenURI(1)).to.eq("https://example.com");
    expect(await erc721.nextTokenId()).to.eq(1);
    expect(await erc721.owner()).to.eq(owner.address);
  });

  it("should not allow initializing with empty trusted address", async () => {
    const ERC721 = await ethers.getContractFactory("ERC721Token");

    await expect(
      ERC721.deploy(
        "TestToken",
        "TEST",
        "https://example.com/contractURI",
        "https://example.com",
        ZERO_ADDRESS,
        10
      )
    ).to.be.revertedWith("InvalidAddress");
  });

  it("should allow minting with a trusted address", async () => {
    const { v, r, s } = await ERC721_generateSignature(
      erc721,
      trustedAddress,
      user.address
    );

    expect((await erc721.balanceOf(user.address)).toNumber()).to.eq(0);
    expect(await erc721.nextTokenId()).to.eq(1);
    await expect(erc721.ownerOf(1)).to.be.revertedWith(
      "ERC721: invalid token ID"
    );
    expect(await erc721.claims(user.address)).to.eq(0);

    await erc721.connect(user).mint(user.address, r, s, v);

    expect((await erc721.balanceOf(user.address)).toNumber()).to.eq(1);
    expect(await erc721.nextTokenId()).to.eq(2);
    expect(await erc721.ownerOf(1)).to.eq(user.address);
    expect(await erc721.claims(user.address)).to.eq(1);
  });

  it("should allow minting with a trusted address - different address", async () => {
    const { v, r, s } = await ERC721_generateSignature(
      erc721,
      trustedAddress,
      user.address
    );

    expect((await erc721.balanceOf(user.address)).toNumber()).to.eq(0);
    expect(await erc721.nextTokenId()).to.eq(1);
    await expect(erc721.ownerOf(1)).to.be.revertedWith(
      "ERC721: invalid token ID"
    );
    expect(await erc721.claims(user.address)).to.eq(0);

    // user mints for user2
    await erc721.connect(user).mint(user2.address, r, s, v);

    // nft transferred to user2, not user
    expect((await erc721.balanceOf(user.address)).toNumber()).to.eq(0);
    expect((await erc721.balanceOf(user2.address)).toNumber()).to.eq(1);
    expect(await erc721.nextTokenId()).to.eq(2);
    expect(await erc721.ownerOf(1)).to.eq(user2.address);
    // claimer should still be user, not user2
    expect(await erc721.claims(user.address)).to.eq(1);
    expect(await erc721.claims(user2.address)).to.eq(0);
  });

  it("should throw an error if minted past max supply", async () => {
    const erc721 = await ERC721.deploy(
      "TestToken",
      "TEST",
      "https://example.com/contractURI",
      "https://example.com",
      trustedAddress.address,
      1 // only 1 maxSupply
    );

    const mint = async (user: SignerWithAddress) => {
      const { v, r, s } = await ERC721_generateSignature(
        erc721,
        trustedAddress,
        user.address
      );
      await erc721.connect(user).mint(user.address, r, s, v);
    };
    await mint(user);
    await expect(mint(user2)).to.revertedWith("ExceedsMaxSupply");
  });

  it("should be compatible with ERC165, ERC721 and ERC721Metadata", async () => {
    for (const id of ["0x01ffc9a7", "0x80ac58cd", "0x5b5e139f"]) {
      expect(await erc721.supportsInterface(id)).to.eq(true);
    }
  });

  it("should reject on invalid signer - wrong trustedAddress", async () => {
    const { domain, types, value } = getEIP712TypedData({
      to: user.address,
      contractAddress: erc721.address,
      chainId: hre.network.config.chainId as number,
      domainName: await erc721.name(),
      domainVersion: "1.0",
    });
    const rawSignature: string = await user2._signTypedData(
      domain,
      types,
      value
    );
    const { v, r, s } = ethers.utils.splitSignature(rawSignature);

    const sb = erc721.connect(user);

    await expect(sb.mint(user.address, r, s, v)).to.be.revertedWith(
      "InvalidAddress"
    );
    // try minting to another address
    await expect(sb.mint(user2.address, r, s, v)).to.be.revertedWith(
      "InvalidAddress"
    );
  });

  it("should reject on signature used by someone else", async () => {
    const { domain, types, value } = getEIP712TypedData({
      to: user.address, // signature meant to be used by `user`
      contractAddress: erc721.address,
      chainId: hre.network.config.chainId as number,
      domainName: await erc721.name(),
      domainVersion: "1.0",
    });
    const rawSignature: string = await trustedAddress._signTypedData(
      domain,
      types,
      value
    );
    const { v, r, s } = ethers.utils.splitSignature(rawSignature);

    const sb = erc721.connect(user2); // user2 tries minting with signature for `user`

    await expect(sb.mint(user2.address, r, s, v)).to.be.revertedWith(
      "InvalidAddress"
    );
    // try minting to another address
    await expect(sb.mint(user.address, r, s, v)).to.be.revertedWith(
      "InvalidAddress"
    );
  });

  it("should not allow claiming again", async () => {
    let { v, r, s } = await ERC721_generateSignature(
      erc721,
      trustedAddress,
      user.address
    );

    const sb = erc721.connect(user);

    await sb.mint(user.address, r, s, v);
    await expect(sb.mint(user.address, r, s, v)).to.be.revertedWith(
      "AlreadyClaimed"
    );
    // try minting to another address
    await expect(sb.mint(user2.address, r, s, v)).to.be.revertedWith(
      "AlreadyClaimed"
    );

    // Try latest signature
    ({ v, r, s } = await ERC721_generateSignature(
      erc721,
      trustedAddress,
      user.address
    ));
    await expect(sb.mint(user.address, r, s, v)).to.be.revertedWith(
      "AlreadyClaimed"
    );
    // try minting to another address
    await expect(sb.mint(user2.address, r, s, v)).to.be.revertedWith(
      "AlreadyClaimed"
    );
  });

  it("should revert on signature replay", async () => {
    // mint token 1 on contract A
    const erc721_A = await ERC721.deploy(
      "ERC721_A",
      "ERC721_A",
      "https://example.com/contractURI",
      "https://example.com",
      trustedAddress.address,
      10
    );
    const { domain, types, value } = getEIP712TypedData({
      to: user.address,
      contractAddress: erc721_A.address,
      chainId: hre.network.config.chainId as number,
      domainName: "ERC721_A", // contract A name
      domainVersion: "1.0",
    });
    const rawSignature: string = await trustedAddress._signTypedData(
      domain,
      types,
      value
    );
    const { v, r, s } = ethers.utils.splitSignature(rawSignature);
    await erc721_A.connect(user).mint(user.address, r, s, v);

    // replay signature from contract A to mint from contract B
    const erc721_B = await ERC721.deploy(
      "ERC721_B",
      "ERC721_B",
      "https://example.com/contractURI",
      "https://example.com",
      trustedAddress.address,
      10
    );
    await expect(erc721_B.connect(user).mint(user.address, r, s, v)).to.be
      .reverted;
    // try minting to another address
    await expect(erc721_B.connect(user).mint(user2.address, r, s, v)).to.be
      .reverted;
  });

  it("should prevent re-entrancy", async () => {
    const ReenterMint: ReenterMint__factory = await ethers.getContractFactory(
      "ReenterMint"
    );

    const reenterMint = await ReenterMint.deploy();
    let { v, r, s } = await ERC721_generateSignature(
      erc721,
      trustedAddress,
      reenterMint.address
    );

    // Since tokenId is not part of signature, no need to request signature from backend multiple times
    // And instead use the signature first generated
    // But it would still fail since it will try to mint the same tokenId
    // which is prohibited in ERC721
    // After moving the _safeMint() for CEI, it should now revert with AlreadyClaimed
    await expect(
      reenterMint.attack(erc721.address, r, s, v)
    ).to.be.revertedWith("AlreadyClaimed");
  });
});
