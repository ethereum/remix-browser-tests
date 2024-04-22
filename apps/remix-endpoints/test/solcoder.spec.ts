/* eslint-disable indent */
import chai from 'chai';
import axios from 'axios';
import { describe, it } from 'mocha';
import https from 'https';

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false // This will ignore SSL certificate errors
  	})
});

const API_URL = 'https://127.0.0.1:1025';

describe('solcoder', () => {
  it('What are function modifiers solidity_answer', async () => {
    const postData = {
      data: [
        "What are function modifiers",
        "solidity_answer",
        false,
        5,
        1,
        0.8,
        50
      ]
    };

    const config = {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000,  // total request time including connection setup
    };

	const response = await axiosInstance.post(`${API_URL}/solcoder/`, postData, config)
    console.log(response.data);
    // TODO: add more assertions
    chai.expect(response.data.data[0]).not.to.be.empty;
    chai.expect(response.data.is_generating).to.equal(false);
  });

  it("Generate code from user comment", async () =>{
    setTimeout( async () => {
      const postData = {
      data: [
        `// SPDX-License-Identifier: GPL-3.0
        pragma solidity >=0.8.2 <0.9.0;
        contract Storage {
          /// function \`StringEncode\` for encoding a string with abi.encode
          `,
        "code_completion",
        "",
        false,
        50,
        0.9,
        0.92,
        50
      ]
      };

      const config = {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000,  // total request time including connection setup
      };
      
      const response = await axiosInstance.post(`${API_URL}/solcoder/`, postData, config)
      console.log(response.data);
      // TODO: add more assertions
      
      chai.expect(response.data.data[0]).not.to.be.empty;
      chai.expect(response.data.data[0]).to.contains('function')
      chai.expect(response.data.data[0]).to.contains('StringEncode')
      chai.expect(response.data.is_generating).to.equal(false);
    }, 11000)
  });


  it("Explain user code using context", async () =>{
    setTimeout( async () => {
      const postData = {
      data: [
        `function store(uint256 num) public {
          number = num;
        }`,
        "code_generation",
        false,
        20,
        0.9,
        0.92,
        50,
        `/ SPDX-License-Identifier: GPL-3.0
    
        pragma solidity >=0.8.2 <0.9.0;
        
        /**
         * @title Storage
         * @dev Store & retrieve value in a variable
         * @custom:dev-run-script ./scripts/deploy_with_ethers.ts
         */
        contract Storage {
        
          uint256 number;
        
          /**
           * @dev Store value in variable
           * @param num value to store
           */
          function store(uint256 num) public {
            number = num;
          }

          /**
           * @dev Return value 
           * @return value of 'number'
           */
          function retrieve() public view returns (uint256){
            return number;
          }
        }`
      ]
    };

    const config = {
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 10000,  // total request time including connection setup
    };

    const response = await axiosInstance.post(`${API_URL}/solcoder/`, postData, config)
    console.log(response.data);
    // TODO: add more assertions
    chai.expect(response.data.data[0]).not.to.be.empty;
    chai.expect(response.data.is_generating).to.equal(false);
    }, 22000)
  });

  it("Explain user code without using any context", async () =>{
    setTimeout( async () => {
      const postData = {
        data: [
          `function store(uint256 num) public {
        number = num;
      }`,
          "code_explaining",
          false,
          20,
          0.9,
          0.92,
          50,
      ""
        ]
      };

      const config = {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000,  // total request time including connection setup
      };
    
    const response = await axiosInstance.post(`${API_URL}/solcoder/`, postData, config)
      console.log(response.data);
      chai.expect(response.data.data[0]).not.to.be.empty;
      chai.expect(response.data.is_generating).to.equal(false);
    }, 33000)
  });

})