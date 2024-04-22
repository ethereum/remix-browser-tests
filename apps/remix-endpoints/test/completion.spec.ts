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

describe('completion', () => {
    it('function add 3 numbers completion', async () => {
        const postData = {
            data: [
                "pragma solidity 0.8.0\n contract Test{\n\t//function add 3 numbers\n",
                "code_completion",
                "",
                false,
                20,
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

        const response = await axiosInstance.post(`${API_URL}/completion/`, postData, config)
        console.log(response.data);
        // TODO: add more assertions
        chai.expect(response.data.data[0]).not.to.be.empty;
        chai.expect(response.data.is_generating).to.equal(false);
    })

    it("Generate insertion code", async () =>{
        const postData = {
          data: [
            `// SPDX-License-Identifier: GPL-3.0
    
            pragma solidity >=0.8.2 <0.9.0;
            
            /**
             * @title Storage
             * @dev Store & retrieve value in a variable
             * @custom:dev-run-script ./scripts/deploy_with_ethers.ts
             */
            contract Storage {
            
                uint256 number;`,
            "code_insertion",
            `/**
            * @dev Return value 
            * @return value of 'number'
            */
           function retrieve() public view returns (uint256){
               return number;
           }
       }`,
            20, 
            0.5,
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
    
        const response = await axiosInstance.post(`${API_URL}/completion/`, postData, config)
        console.log(response.data);
        // TODO: add more assertions
        chai.expect(response.data.data[0]).not.to.be.empty;
        chai.expect(response.data.is_generating).to.equal(false);
    });
    
})