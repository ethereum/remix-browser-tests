// FIXME: should this be renamed to indicate its offset/length orientation?
// Add "readonly property"?
export interface Location {
  start: number;
  length: number;
  file: number; // Would it be clearer to call this a file index?
}

// This is intended to be compatible with VScode's Position.
// However it is pretty common with other things too.
// Note: File index is missing here
export interface LineColPosition {
  readonly line: number;
  readonly character: number;
}

// This is intended to be compatible with vscode's Range
// However it is pretty common with other things too.
// Note: File index is missing here
export interface LineColRange {
  readonly start: LineColPosition;
  readonly end: LineColPosition;
}

export interface Node {
  ast?: AstNode;
  source?: string;
  id?: number;
}

export interface AstNode {
  /* The following fields are essential, and indicates an that object
     is an AST node. */
  id: number; // This is unique across all nodes in an AST tree
  nodeType: string;
  src: string;

  absolutePath?: string;
  exportedSymbols?: Record<string, unknown>;
  nodes?: Array<AstNode>;
  literals?: Array<string>;
  file?: string;
  scope?: number;
  sourceUnit?: number;
  symbolAliases?: Array<string>;
  [x: string]: any;
}

export interface AstNodeAtt {
  operator?: string;
  string?: null;
  type?: string;
  value?: string;
  constant?: boolean;
  name?: string;
  public?: boolean;
  exportedSymbols?: Record<string, unknown>;
  argumentTypes?: null;
  absolutePath?: string;
  [x: string]: any;
}
