const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("RemittancePay", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployRemittancePayFixture() {
        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const RemittancePay = await ethers.getContractFactory("RemittancePay");
        const remittancePay = await RemittancePay.deploy();

        return { remittancePay, owner, otherAccount };
    }

    describe("Deployment", function () {
        it("Should deploy successfully", async function () {
            const { remittancePay } = await loadFixture(deployRemittancePayFixture);
            expect(remittancePay.target).to.not.equal(0);
        });

        it("Should allow creating a profile", async function () {
            const { remittancePay, owner } = await loadFixture(deployRemittancePayFixture);

            await remittancePay.createProfile(
                "John Doe",
                "john@example.com",
                "1234567890",
                "USA",
                30,
                "Male",
                "NID123",
                "123 Main St"
            );

            const profile = await remittancePay.getProfile(owner.address);
            expect(profile.name).to.equal("John Doe");
        });
    });
});
