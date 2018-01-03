var remixLib = require('remix-lib')
var compilerInput = remixLib.helpers.compiler.compilerInput
var compiler = require('solc')
var stateDecoder = require('../../../src/decoder/stateDecoder')
var vmCall = require('../vmCall')

module.exports = function testMappingStorage (st, cb) {
  var mappingStorage = require('../contracts/mappingStorage')
  var privateKey = new Buffer('dae9801649ba2d95a21e688b56f77905e5667c44ce868ec83f82e838712a2c7a', 'hex')
  var vm = vmCall.initVM(st, privateKey)
  var output = compiler.compileStandardWrapper(compilerInput(mappingStorage.contract))
  output = JSON.parse(output)
  vmCall.sendTx(vm, {nonce: 0, privateKey: privateKey}, null, 0, output.contracts['test.sol']['SimpleMappingState'].evm.bytecode.object, function (error, txHash) {
    if (error) {
      console.log(error)
      st.end(error)
    } else {
      remixLib.global.web3.eth.getTransaction(txHash, (error, tx) => {
        if (error) {
          console.log(error)
          st.end(error)
        } else {
          testMapping(st, vm, privateKey, tx.contractAddress, output, cb)
        }
      })
    }
  })
}

function testMapping (st, vm, privateKey, contractAddress, output, cb) {
  vmCall.sendTx(vm, {nonce: 1, privateKey: privateKey}, contractAddress, 0, '2fd0a83a00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000001074686973206973206120737472696e6700000000000000000000000000000000',
        function (error, txHash) {
          if (error) {
            console.log(error)
            st.end(error)
          } else {
            console.log(txHash)
            remixLib.global.web3.eth.getTransaction(txHash, (error, tx) => {
              if (error) {
                console.log(error)
                st.end(error)
              } else {
                var TraceManager = require('remix-core').trace.TraceManager
                var traceManager = new TraceManager()
                traceManager.resolveTrace(tx, () => {
                  var StorageResolver = require('remix-core').storage.StorageResolver
                  var StorageViewer = require('remix-core').storage.StorageViewer
                  var storageViewer = new StorageViewer({
                    stepIndex: 199,
                    tx: tx,
                    address: contractAddress
                  }, new StorageResolver(), traceManager)
                  var stateVars = stateDecoder.extractStateVariables('SimpleMappingState', output.sources)
                  stateDecoder.decodeState(stateVars, storageViewer).then((result) => {
                    console.log('ok', JSON.stringify(result))
                    st.equal(result['_num'].value, '1')
                    st.equal(result['_num'].type, 'uint256')
                    st.equal(result['_iBreakSolidityState'].type, 'mapping(string => uint256)')
                    st.equal(result['_iBreakSolidityState'].value['74686973206973206120737472696e67'].value, '1')
                    st.equal(result['_iBreakSolidityState'].value['74686973206973206120737472696e67'].type, 'uint256')
                    st.equal(result['_iBreakSolidityStateInt'].type, 'mapping(uint256 => uint256)')
                    st.equal(result['_iBreakSolidityStateInt'].value['0000000000000000000000000000000000000000000000000000000000000001'].value, '1')
                    st.equal(result['_iBreakSolidityStateInt'].value['0000000000000000000000000000000000000000000000000000000000000001'].type, 'uint256')
                    cb()
                  }, (reason) => {
                    console.log('fail')
                    st.end(reason)
                  })
                })
              }
            })
          }
        })
}
