export const remixWelcome = () => {
  return `<div>
    <div> - Welcome to Remix {props.version} - </div>
    <br/>
    <div>You can use this terminal to: </div>
    <ul className='ul'>
      <li>Check transactions details and start debugging.</li>
      <li>Execute JavaScript scripts:
        <br />
        <i> - Input a script directly in the command line interface </i>
        <br />
        <i> - Select a Javascript file in the file explorer and then run \`remix.execute()\` or \`remix.exeCurrent()\`  in the command line interface  </i>
        <br />
        <i> - Right click on a JavaScript file in the file explorer and then click \`Run\` </i>
      </li>
    </ul>
    <div>The following libraries are accessible:</div>
    <ul className='ul'>
      <li><a target="_blank" href="https://web3js.readthedocs.io/en/1.0/">web3 version 1.0.0</a></li>
      <li><a target="_blank" href="https://docs.ethers.io">ethers.js</a> </li>
      <li><a target="_blank" href="https://www.npmjs.com/package/swarmgw">swarmgw</a> </li>
      <li>remix (run remix.help() for more info)</li>
    </ul>
  </div>`
}
