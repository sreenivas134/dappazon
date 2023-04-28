import React, { useEffect, useState, useSyncExternalStore } from 'react'
import { ethers } from 'ethers'

// Components
import Navigation from './components/Navigation'
import Section from './components/Section'
import Product from './components/Product'

// ABIs
import Dappazon from './abis/Dappazon.json'

// Config
import config from './config.json'

function App() {
  // React uses component state database, where we can store variables and access them anywhere in the app
  // Below statement creates a variable account and a method to set it's value
  const [account, setAccount] = useState('')
  const [provider, setProvider] = useState(null)
  const [dappazon, setDappazon] = useState(null)

  const [electronics, setElectronics] = useState(null)
  const [clothing, setClothing] = useState(null)
  const [toys, setToys] = useState(null)

  const [item, setItem] = useState(null)
  const [toggle, setToggle] = useState(false)
  const [network, setNetwork] = useState(null)
  const [isNetworkConfigured, setIsNetworkConfigured] = useState(false)

  const togglePop = (item) => {
    setItem(item)
    toggle ? setToggle(false) : setToggle(true)
  }

  const loadAccount = async () => {
    const account = window.ethereum.selectedAddress
    setAccount(account)
  }

  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)

    const network = await provider.getNetwork()
    console.log("Network", network)
    setNetwork(network)
    // console.log(typeof(network.chainId))

    // Connect to smart contract
    if (config[network.chainId] != undefined) {
      const dappazon = new ethers.Contract(
        config[network.chainId]['dappazon']['address'],
        Dappazon,
        provider
      )
      setIsNetworkConfigured(true)

      setDappazon(dappazon)

      // console.log("Item", await dappazon.items(1))

      const items = []
      for (var i = 0; i < 9; i++){
        const item = await dappazon.items(i+1)
        items.push(item)
      }
      // console.log(items)

      const electronics = items.filter((item) => item.category === 'electronics')
      const clothing = items.filter((item) => item.category === 'clothing')
      const toys = items.filter((item) => item.category === 'toys')

      setElectronics(electronics)
      setClothing(clothing)
      setToys(toys)
    }
    
    
  }

  useEffect(() => {
    loadAccount()
  })

  useEffect(() => {
    loadBlockchainData()
  }, [])

  return (
    <div>
      <Navigation account={account} setAccount={setAccount}/>
      <h2>Dappazon Best Sellers</h2>
        {electronics && clothing && toys && (
          <>
            <Section title={"Clothing & Jewelry"} items={clothing} togglePop={togglePop}/>
            <Section title={"Electronics & Gadgets"} items={electronics} togglePop={togglePop}/>
            <Section title={"Toys & Gaming"} items={toys} togglePop={togglePop}/>
          </>
        )}

        {toggle && (
          <Product item={item} provider={provider} account={account} dappazon={dappazon} togglePop={togglePop}/>
        )}

        {!isNetworkConfigured && network && (
          <p>{network.name} is not supported! Please switch to account on Hardhat node to use the services.</p>
        )}
    </div>
  );
}

export default App;
