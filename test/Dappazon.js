const { expect } = require("chai")
const { ethers } = require("hardhat")
const { any } = require("hardhat/internal/core/params/argumentTypes")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe("Dappazon", () => {
  let dappazon
  let deployer, buyer
  beforeEach(async() => {
    // setup accounts
    [deployer, buyer] = await ethers.getSigners()
    // console.log(deployer, buyer)

    const Dappazon = await ethers.getContractFactory('Dappazon')
    dappazon = await Dappazon.deploy()
  })

  describe("deployment", () => {
    it('sets the owner', async () => {
      expect(await dappazon.owner()).to.equal(deployer.address)
    })
  })

  describe('listing', () => {
    let transaction
    // Global constants for listing an item...
    const ID = 1
    const NAME = "Shoes"
    const CATEGORY = "Clothing"
    const IMAGE = "https://ipfs.io/ipfs/QmTYEboq8raiBs7GTUg2yLXB3PMz6HuBNgNfSZBx5Msztg/shoes.jpg"
    const COST = tokens(1)
    const RATING = 4
    const STOCK = 5
    beforeEach(async() => {
      // List item
      transaction = await dappazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()

      // Buy item
      transaction = await dappazon.connect(buyer).buy(ID, { value: COST })
    })

    it('returns item attributes', async () => {
      const item = await dappazon.items(ID)
      // console.log(item)
      expect(item.id).to.equal(ID)
    })

    it('Emits list event', () => {
      expect(transaction).to.emit(dappazon, "List");
    })

    it('Emits the contract balance', async () => {
      const result = await ethers.provider.getBalance(dappazon.address)
      console.log(result)
      expect(result).to.equal(COST)
    })

    it("Updates buyer's order count.", async () => {
      const result = await dappazon.orderCount(buyer.address)
      expect(result).to.equal(1)
    })

    it("Adds the order", async () => {
      const order = await dappazon.orders(buyer.address, 1)
      expect(order.time).to.be.greaterThan(0)
      expect(order.item.name).to.equal(NAME)
    })

    it("Emits buy event", async () => {
      expect(transaction).to.emit(dappazon, 'Buy')
    })

  })

  describe('Withdraw', () => {
    let transaction
    let balanceBefore

    beforeEach(async () => {
      // Global constants for listing an item...
      const ID = 1
      const NAME = "Shoes"
      const CATEGORY = "Clothing"
      const IMAGE = "https://ipfs.io/ipfs/QmTYEboq8raiBs7GTUg2yLXB3PMz6HuBNgNfSZBx5Msztg/shoes.jpg"
      const COST = tokens(1)
      const RATING = 4
      const STOCK = 5

      // List item
      transaction = await dappazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()

      // Buy item
      transaction = await dappazon.connect(buyer).buy(ID, { value: COST })

      // get previous balance
      balanceBefore = await ethers.provider.getBalance(deployer.address)

      // withdraw
      transaction = await dappazon.connect(deployer).withdraw()
      await transaction.wait()
    })

    it("Is updated owner balance!",  async () => {
      const balanceAfter = await ethers.provider.getBalance(deployer.address)
      expect(balanceAfter).to.greaterThan(balanceBefore)
    })

    it("Contract balance updated", async () => {
      const contractBal = await ethers.provider.getBalance(dappazon.address)
      expect(contractBal).to.equal(0)
    })
  })
})
