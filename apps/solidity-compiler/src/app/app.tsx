import React, { useState, useEffect } from 'react';

import { SolidityCompiler } from '@remix-ui/solidity-compiler' // eslint-disable-line

import { CompilerClientApi } from './compiler'

const remix = new CompilerClientApi()

export const App = () => {  
  return (
    <div className="debugger">
      <SolidityCompiler plugin={remix} />
    </div>
  );
};

export default App;
