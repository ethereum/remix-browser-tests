var csjs = require('csjs-inject')

var css = csjs`
  .label {
    margin-bottom     : 0px;
  }
  .fileexplorer       {
    box-sizing        : border-box;
  }
  input[type="file"] {
      display: none;
  }
  .folder,
  .file               {
    font-size         : 14px;
    cursor            : pointer;
  }
  .file               {
    padding           : 4px;
  }
  .newFile            {
    padding           : 4px;
  }
  .newFile i          {
    cursor            : pointer;
  }
  .newFile i:hover    {
    color             : var(--secondary)
  }
  .menu               {
    margin-left       : 20px;
  }
  .items              {
    display           : inline
  }
  .hasFocus           {
  }
  .rename             {
  }
  .remove             {
    margin-left       : auto;
    padding-left      : 5px;
    padding-right     : 5px;
  }
  .activeMode         {
    display           : flex;
    width             : 100%;
    margin-right      : 10px;
    padding-right     : 19px;
  }
  .activeMode > div   {
    min-width         : 10px;
  }
  ul                  {
    padding           : 0;
  }
`

module.exports = css
