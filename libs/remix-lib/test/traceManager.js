'use strict'
const TraceManager = require('../src/trace/traceManager')
const tape = require('tape')
const Web3Providers = require('../src/web3Provider/web3Providers')
const web3Test = require('./resources/testWeb3')

let web3 = null

tape('TraceManager', function (t) {
  let traceManager

  t.test('TraceManager.init', function (st) {
    const web3Providers = new Web3Providers()
    web3Providers.addProvider('TEST', web3Test)
    web3Providers.get('TEST', function (error, obj) {
      if (error) {
        const mes = 'provider TEST not defined'
        console.log(mes)
        st.fail(mes)
      } else {
        web3 = obj
        traceManager = new TraceManager({web3: web3})
        st.end()
      }
    })
  })

  t.test('TraceManager.resolveTrace', function (st) {
    const tx = web3.eth.getTransaction('0x20ef65b8b186ca942fcccd634f37074dde49b541c27994fc7596740ef44cfd51')
    traceManager.resolveTrace(tx, function (error, result) {
      if (error) {
        st.fail(' - traceManager.resolveTrace - failed ' + result)
      } else {
        st.end()
      }
    })
  })

  t.test('TraceManager.getLength ', function (st) {
    traceManager.getLength(function (error, result) {
      if (error) {
        st.fail(error)
      } else {
        st.end()
      }
    })
  })

  t.test('TraceManager.inRange ', function (st) {
    st.notOk(traceManager.inRange(-1))
    st.ok(traceManager.inRange(10))
    st.notOk(traceManager.inRange(142))
    st.ok(traceManager.inRange(141))
    st.end()
  })

  t.test('TraceManager.accumulateStorageChanges', function (st) {
    const result = traceManager.accumulateStorageChanges(110, '0x0d3a18d64dfe4f927832ab58d6451cecc4e517c5', {})
    st.ok(result['0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563'].value === '0x38')
    st.end()
  })

  t.test('TraceManager.getCallData', function (st) {
    try {
      const result = traceManager.getCallDataAt(0)
      st.ok(result[0] === '0x60fe47b10000000000000000000000000000000000000000000000000000000000000038')
      st.end()
    } catch (error) {
      st.fail(error)
    }
  })

  t.test('TraceManager.getCallStackAt', function (st) {
    st.plan(3)
    try {
      const result = traceManager.getCallStackAt(0)
      st.ok(result[0] === '0x0d3a18d64dfe4f927832ab58d6451cecc4e517c5')
    } catch (error) {
      st.fail(error)
    }

    try {
      const result = traceManager.getCallStackAt(64)
      st.ok(result.length === 2)
      st.ok(result[1] === '(Contract Creation - Step 63)')
    } catch (error) {
      st.fail(error)
    }
  })

  t.test('TraceManager.getStackAt', function (st) {
    st.plan(3)
    try {
      const result = traceManager.getStackAt(0)
      console.log(result)
      st.ok(result.length === 0)
    } catch (error) {
      st.fail(error)
    }

    try {
      const result = traceManager.getStackAt(28)
      console.log(result)
      st.ok(result.length === 4)
      st.ok(result[3] === '0x60fe47b1')
    } catch (error) {
      st.fail(error)
    }
  })

  t.test('TraceManager.getLastCallChangeSince', function (st) {
    st.plan(3)

    try {
      const result = traceManager.getLastCallChangeSince(10)
      console.log(result)
      st.ok(result.start === 0)
    } catch (error) {
      st.fail(error)
    }

    try {
      const result = traceManager.getLastCallChangeSince(70)
      console.log(result)
      st.ok(result.start === 64)
    } catch (error) {
      st.fail(error)
    }

    try {
      const result = traceManager.getLastCallChangeSince(111)
      console.log(result)
      st.ok(result.start === 0)
      // this was 109 before: 111 is targeting the root call (starting index 0)
      // this test make more sense as it is now (109 is the index of RETURN).
    } catch (error) {
      st.fail(error)
    }
  })

  t.test('TraceManager.getCurrentCalledAddressAt', function (st) {
    st.plan(3)

    try {
      const result = traceManager.getCurrentCalledAddressAt(10)
      console.log(result)
      st.ok(result === '0x0d3a18d64dfe4f927832ab58d6451cecc4e517c5')
    } catch (error) {
      st.fail(error)
    }

    try {
      const result = traceManager.getCurrentCalledAddressAt(70)
      console.log(result)
      st.ok(result === '(Contract Creation - Step 63)')
    } catch (error) {
      st.fail(error)
    }

    try {
      const result = traceManager.getCurrentCalledAddressAt(111)
      console.log(result)
      st.ok(result === '0x0d3a18d64dfe4f927832ab58d6451cecc4e517c5')
    } catch (error) {
      st.fail(error)
    }
  })

  t.test('TraceManager.getContractCreationCode', function (st) { // contract code has been retrieved from the memory
    try {
      const result = traceManager.getContractCreationCode('(Contract Creation - Step 63)')
      console.log(result)
      st.ok(result === '0x60606040526040516020806045833981016040528080519060200190919050505b806001016000600050819055505b50600a80603b6000396000f360606040526008565b00000000000000000000000000000000000000000000000000000000000000002d')
      st.end()
    } catch (error) {
      st.fail(error)
    }
  })

  t.test('TraceManager.getMemoryAt', function (st) {
    st.plan(3)
    try {
      const result = traceManager.getMemoryAt(0)
      console.log(result)
      st.ok(result.length === 0)
    } catch (error) {
      st.fail(error)
    }

    try {
      const result = traceManager.getMemoryAt(34)
      console.log(result)
      st.ok(result.length === 3)
      st.ok(result[2] === '0000000000000000000000000000000000000000000000000000000000000060')
    } catch (error) {
      st.fail(error)
    }
  })

  t.test('TraceManager.getCurrentPC', function (st) {
    traceManager.getCurrentPC(13, function (error, result) {
      console.log(result)
      if (error) {
        st.fail(error)
      } else {
        st.ok(result === '65')
        st.end()
      }
    })
  })

  t.test('TraceManager.getCurrentStep', function (st) {
    traceManager.getCurrentStep(66, function (error, result) {
      console.log(result)
      if (error) {
        st.fail(error)
      } else {
        st.ok(result === 2)
        st.end()
      }
    })
  })

  t.test('TraceManager.getMemExpand', function (st) {
    try {
      const result = traceManager.getMemExpand(2)
      console.log(result)
      st.ok(result === '3')
      st.end()
    } catch (error) {
      st.fail(error)
    }
  })

  t.test('TraceManager.getStepCost', function (st) {
    try {
      const result = traceManager.getStepCost(23)
      console.log(result)
      st.ok(result === '3')
      st.end()
    } catch (error) {
      st.fail(error)
    }
  })

  t.test('TraceManager.getRemainingGas', function (st) {
    try {
      const result = traceManager.getRemainingGas(55)
      console.log(result)
      st.ok(result === '79306')
      st.end()
    } catch (error) {
      st.fail(error)
    }
  })

  t.test('TraceManager.findStepOverBack', function (st) {
    const result = traceManager.findStepOverBack(116)
    console.log(result)
    st.ok(result === 115)
    st.end()
  })

  t.test('TraceManager.findStepOverForward', function (st) {
    const result = traceManager.findStepOverForward(66)
    console.log(result)
    st.ok(result === 67)
    st.end()
  })

  t.test('TraceManager.findNextCall', function (st) {
    const result = traceManager.findNextCall(10)
    console.log(result)
    st.ok(result === 63)
    st.end()
  })

  t.test('TraceManager.getAddresses', function (st) {
    const result = traceManager.getAddresses()
    st.ok(result[0] === '0x0d3a18d64dfe4f927832ab58d6451cecc4e517c5')
    st.ok(result[1] === '(Contract Creation - Step 63)')
    st.end()
  })

  t.test('TraceManager.getReturnValue', function (st) {
    traceManager.getReturnValue(108, function (error, result) {
      if (error) {
        st.fail(error)
      } else {
        st.ok(result[0] === '0x60606040526008565b0000000000000000000000000000000000000000000000')
        st.end()
      }
    })
  })
})
