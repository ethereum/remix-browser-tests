export interface ExtractData {
    children?: Array<{key: number | string, value: ExtractData}>
    self?: string | number,
    isNode?: boolean,
    isLeaf?: boolean,
    isArray?: boolean,
    isStruct?: boolean,
    isMapping?: boolean,
    type?: string,
    isProperty?: boolean,
    hasNext?: boolean,
    cursor?: number
}

export type ExtractFunc = (json: any, parent?: any) => ExtractData

export interface DropdownPanelProps {
    dropdownName: string,
    dropdownMessage?: string,
    calldata?: {
        [key: string]: string
    },
    header?: string,
    loading?: boolean
    extractFunc?: ExtractFunc,
    formatSelfFunc?: FormatSelfFunc,
    loadMore?: Function
}

export type FormatSelfFunc = (key: string | number, data: ExtractData) => JSX.Element