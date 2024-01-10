/**
 * Copyright (c) 2017 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import { Terminal, ITerminalAddon } from 'xterm';


interface ITerminalDimensions {
  /**
   * The number of rows in the terminal.
   */
  rows: number;

  /**
   * The number of columns in the terminal.
   */
  cols: number;
}

const MINIMUM_COLS = 2;
const MINIMUM_ROWS = 1;

export class FitAddon implements ITerminalAddon {
  private _terminal: Terminal | undefined;

  constructor() {}

  public activate(terminal: Terminal): void {
    this._terminal = terminal;
  }

  public dispose(): void {}

  public fit(): void {
    const dims = this.proposeDimensions();
    if (!dims || !this._terminal || isNaN(dims.cols) || isNaN(dims.rows)) {
      return;
    }

    // TODO: Remove reliance on private API
    const core = (this._terminal as any)._core;

    // Force a full render
    if (this._terminal.rows !== dims.rows || this._terminal.cols !== dims.cols) {
      core._renderService.clear();
      this._terminal.resize(dims.cols, dims.rows);
    }
  }

  public proposeDimensions(): ITerminalDimensions | undefined {
    if (!this._terminal) {
      return undefined;
    }

    if (!this._terminal.element || !this._terminal.element.parentElement || !this._terminal.element.parentElement.parentElement) {
      return undefined;
    }

    // TODO: Remove reliance on private API
    const core = (this._terminal as any)._core;
    const dims = core._renderService.dimensions;

    if (dims.css.cell.width === 0 || dims.css.cell.height === 0) {
      return undefined;
    }

    const scrollbarWidth = this._terminal.options.scrollback === 0 ?
      0 : core.viewport.scrollBarWidth;


    const parentElementStyle = window.getComputedStyle(this._terminal.element.parentElement.parentElement);
    const parentElementHeight = parseInt(parentElementStyle.getPropertyValue('height'));
    const parentElementWidth = Math.max(0, parseInt(parentElementStyle.getPropertyValue('width')));
    const elementStyle = window.getComputedStyle(this._terminal.element);
    const elementPadding = {
      top: parseInt(elementStyle.getPropertyValue('padding-top')),
      bottom: parseInt(elementStyle.getPropertyValue('padding-bottom')),
      right: parseInt(elementStyle.getPropertyValue('padding-right')),
      left: parseInt(elementStyle.getPropertyValue('padding-left'))
    };
    const elementPaddingVer = elementPadding.top + elementPadding.bottom;
    const elementPaddingHor = elementPadding.right + elementPadding.left;
    const availableHeight = parentElementHeight - elementPaddingVer;
    const availableWidth = parentElementWidth - elementPaddingHor - scrollbarWidth;
    const geometry = {
      cols: Math.max(MINIMUM_COLS, Math.floor(availableWidth / dims.css.cell.width)),
      rows: Math.max(MINIMUM_ROWS, Math.floor((availableHeight - 17) / dims.css.cell.height))
    };

    return geometry;
  }
}
