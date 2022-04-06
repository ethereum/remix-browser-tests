import { Plugin } from '@remixproject/engine';
import { ContractABI, ContractAST } from '../types/contract';

const proxyProfile = {
  name: 'openzeppelin-proxy',
  displayName: 'openzeppelin-proxy',
  description: 'openzeppelin-proxy',
  methods: ['isConcerned', 'execute']
};
const UUPS = '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol'
const UUPSBytecode = '608060405260405162000d8638038062000d86833981810160405281019062000029919062000467565b60017f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbd60001c6200005b9190620006a5565b60001b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc60001b146200009357620000926200078a565b5b620000a782826000620000af60201b60201c565b5050620008f4565b620000c083620000f260201b60201c565b600082511180620000ce5750805b15620000ed57620000eb83836200014960201b620000371760201c565b505b505050565b62000103816200017f60201b60201c565b8073ffffffffffffffffffffffffffffffffffffffff167fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b60405160405180910390a250565b606062000177838360405180606001604052806027815260200162000d5f602791396200025560201b60201c565b905092915050565b62000195816200033960201b620000641760201c565b620001d7576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401620001ce90620005d0565b60405180910390fd5b80620002117f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc60001b6200035c60201b620000871760201c565b60000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b606062000268846200033960201b60201c565b620002aa576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401620002a190620005f2565b60405180910390fd5b6000808573ffffffffffffffffffffffffffffffffffffffff1685604051620002d4919062000593565b600060405180830381855af49150503d806000811462000311576040519150601f19603f3d011682016040523d82523d6000602084013e62000316565b606091505b50915091506200032e8282866200036660201b60201c565b925050509392505050565b6000808273ffffffffffffffffffffffffffffffffffffffff163b119050919050565b6000819050919050565b606083156200037857829050620003cb565b6000835111156200038c5782518084602001fd5b816040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401620003c29190620005ac565b60405180910390fd5b9392505050565b6000620003e9620003e3846200063d565b62000614565b9050828152602081018484840111156200040857620004076200081c565b5b620004158482856200071e565b509392505050565b6000815190506200042e81620008da565b92915050565b600082601f8301126200044c576200044b62000817565b5b81516200045e848260208601620003d2565b91505092915050565b6000806040838503121562000481576200048062000826565b5b600062000491858286016200041d565b925050602083015167ffffffffffffffff811115620004b557620004b462000821565b5b620004c38582860162000434565b9150509250929050565b6000620004da8262000673565b620004e6818562000689565b9350620004f88185602086016200071e565b80840191505092915050565b600062000511826200067e565b6200051d818562000694565b93506200052f8185602086016200071e565b6200053a816200082b565b840191505092915050565b600062000554602d8362000694565b915062000561826200083c565b604082019050919050565b60006200057b60268362000694565b915062000588826200088b565b604082019050919050565b6000620005a18284620004cd565b915081905092915050565b60006020820190508181036000830152620005c8818462000504565b905092915050565b60006020820190508181036000830152620005eb8162000545565b9050919050565b600060208201905081810360008301526200060d816200056c565b9050919050565b60006200062062000633565b90506200062e828262000754565b919050565b6000604051905090565b600067ffffffffffffffff8211156200065b576200065a620007e8565b5b62000666826200082b565b9050602081019050919050565b600081519050919050565b600081519050919050565b600081905092915050565b600082825260208201905092915050565b6000620006b28262000714565b9150620006bf8362000714565b925082821015620006d557620006d4620007b9565b5b828203905092915050565b6000620006ed82620006f4565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b60005b838110156200073e57808201518184015260208101905062000721565b838111156200074e576000848401525b50505050565b6200075f826200082b565b810181811067ffffffffffffffff82111715620007815762000780620007e8565b5b80604052505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052600160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60008201527f6f74206120636f6e747261637400000000000000000000000000000000000000602082015250565b7f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f60008201527f6e74726163740000000000000000000000000000000000000000000000000000602082015250565b620008e581620006e0565b8114620008f157600080fd5b50565b61045b80620009046000396000f3fe6080604052366100135761001161001d565b005b61001b61001d565b005b610025610091565b610035610030610093565b6100a2565b565b606061005c83836040518060600160405280602781526020016103ff602791396100c8565b905092915050565b6000808273ffffffffffffffffffffffffffffffffffffffff163b119050919050565b6000819050919050565b565b600061009d610195565b905090565b3660008037600080366000845af43d6000803e80600081146100c3573d6000f35b3d6000fd5b60606100d384610064565b610112576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161010990610319565b60405180910390fd5b6000808573ffffffffffffffffffffffffffffffffffffffff168560405161013a91906102e0565b600060405180830381855af49150503d8060008114610175576040519150601f19603f3d011682016040523d82523d6000602084013e61017a565b606091505b509150915061018a8282866101ec565b925050509392505050565b60006101c37f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc60001b610087565b60000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b606083156101fc5782905061024c565b60008351111561020f5782518084602001fd5b816040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161024391906102f7565b60405180910390fd5b9392505050565b600061025e82610339565b610268818561034f565b935061027881856020860161036b565b80840191505092915050565b600061028f82610344565b610299818561035a565b93506102a981856020860161036b565b6102b28161039e565b840191505092915050565b60006102ca60268361035a565b91506102d5826103af565b604082019050919050565b60006102ec8284610253565b915081905092915050565b600060208201905081810360008301526103118184610284565b905092915050565b60006020820190508181036000830152610332816102bd565b9050919050565b600081519050919050565b600081519050919050565b600081905092915050565b600082825260208201905092915050565b60005b8381101561038957808201518184015260208101905061036e565b83811115610398576000848401525b50505050565b6000601f19601f8301169050919050565b7f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f60008201527f6e7472616374000000000000000000000000000000000000000000000000000060208201525056fe416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a26469706673582212201fbb70b81fbc37a0d465e50bdaf6c661d6411918ae96ccedacef32b393f9533964736f6c63430008070033416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564'
const UUPSABI = [
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "_logic",
              "type": "address"
          },
          {
              "internalType": "bytes",
              "name": "_data",
              "type": "bytes"
          }
      ],
      "stateMutability": "payable",
      "type": "constructor"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "previousAdmin",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "address",
              "name": "newAdmin",
              "type": "address"
          }
      ],
      "name": "AdminChanged",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "address",
              "name": "beacon",
              "type": "address"
          }
      ],
      "name": "BeaconUpgraded",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "address",
              "name": "implementation",
              "type": "address"
          }
      ],
      "name": "Upgraded",
      "type": "event"
  },
  {
      "stateMutability": "payable",
      "type": "fallback"
  },
  {
      "stateMutability": "payable",
      "type": "receive"
  }
]
const UUPSfunAbi = {
  name: "",
  inputs: [
      {
          "internalType": "address",
          "name": "_logic",
          "type": "address"
      },
      {
          "internalType": "bytes",
          "name": "_data",
          "type": "bytes"
      }
  ],
  type: "constructor",
  outputs: [],
  stateMutability: "payable"
}

export class OpenZeppelinProxy extends Plugin {
  blockchain: any
  kind: 'UUPS' | 'Transparent'
  constructor(blockchain) {
    super(proxyProfile)
    this.blockchain = blockchain
  }

  async isConcerned(ast: ContractAST, contracts: ContractABI): Promise<boolean> {
    // check in the AST if it's an upgradable contract
    if (ast.nodes.find(node => node.absolutePath === UUPS)) {
      this.kind = 'UUPS'
      Object.keys(contracts).map(name => {
        const abi = contracts[name].abi
      })
      return true
    }
    return false
  }

  async execute(implAddress: string, _data: string = '') {
    // deploy the proxy, or use an existing one
    if (this.kind === 'UUPS') this.deployUUPSProxy(implAddress, _data)
  }

  async deployUUPSProxy (implAddress: string, _data: string) {
    const data = {
      contractABI: UUPSABI,
      contractByteCode: UUPSBytecode,
      contractName: 'ERC1967Proxy',
      funAbi: UUPSfunAbi,
      funArgs: [implAddress, _data],
      linkReferences: {}
    }

    this.blockchain.deployProxy(data)
  }
}
