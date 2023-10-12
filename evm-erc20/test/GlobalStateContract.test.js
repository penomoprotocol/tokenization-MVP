const { expect } = require("chai");

describe("GlobalStateContract", function() {
  let GlobalStateContract, globalStateContract, owner, addr1, addr2;

  beforeEach(async function() {
    // Deploying the contract
    GlobalStateContract = await ethers.getContractFactory("GlobalStateContract");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    globalStateContract = await GlobalStateContract.deploy(500);
  });

  describe("Investor Registration", function() {
    it("Should allow the owner to register a RI", async function() {
      await globalStateContract.connect(owner).registerInvestor(addr1.address);
      expect(await globalStateContract.isRegisteredInvestor(addr1.address)).to.equal(true);
    });

    it("Should emit an event when RI is registered", async function() {
      await expect(globalStateContract.connect(owner).registerInvestor(addr1.address))
        .to.emit(globalStateContract, "InvestorRegistered")
        .withArgs(addr1.address);
    });

    it("Should not allow non-owners to register RIs", async function() {
      await expect(globalStateContract.connect(addr1).registerInvestor(addr2.address)).to.be.revertedWith("Only the owner can execute this");
    });

    it("Should not allow registering an already registered RI", async function() {
      await globalStateContract.connect(owner).registerInvestor(addr1.address);
      await expect(globalStateContract.connect(owner).registerInvestor(addr1.address)).to.be.revertedWith("Investor is already registered");
    });
  });

  describe("Penomo Fee", function() {
    it("Should allow the owner to set the penomo fee", async function() {
      await globalStateContract.connect(owner).setPenomoFee(600);
      expect(await globalStateContract.penomoFee()).to.equal(600);
    });

    it("Should emit an event when the penomo fee is updated", async function() {
      await expect(globalStateContract.connect(owner).setPenomoFee(600))
        .to.emit(globalStateContract, "PenomoFeeUpdated")
        .withArgs(600);
    });

    it("Should not allow non-owners to set the penomo fee", async function() {
      await expect(globalStateContract.connect(addr1).setPenomoFee(700)).to.be.revertedWith("Only the owner can execute this");
    });
  });
});
