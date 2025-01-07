import { PluginClient } from '@remixproject/plugin';
import ContractInteractionPluginClient from '../ContractInteractionPluginClient';

import { CLEAR_INSTANCES, PIN_INSTANCE, REMOVE_INSTANCE, SET_GAS_LIMIT, SET_INSTANCE, SET_SELECTED_ACCOUNT, SET_SEND_UNIT, SET_SEND_VALUE, UNPIN_INSTANCE } from "../reducers/state"
import { Chain, ContractInstance } from '../types/AbiProviderTypes';

let dispatch: React.Dispatch<any>

export const initDispatch = (_dispatch: React.Dispatch<any>) => {
    dispatch = _dispatch;
};

export const loadPluginAction = async () => {
    await dispatch({
        type: 'SET_LOADING',
        payload: {
            screen: true,
        },
    });

    await ContractInteractionPluginClient.onload();

    //  await ContractVerificationPluginClient.call('layout', 'minimize', 'terminal', true);

    await dispatch({
        type: 'SET_LOADING',
        payload: {
            screen: false,
        },
    });
};

export const loadPinnedContractsAction = async (plugin: PluginClient, chain: Chain) => {
    // TODO: `exists` is not exposed by the plugin-api, which would be better then throwing an error if folder does not exists.
    // const isPinnedAvailable = await plugin.call('fileManager', 'exists',`./looked-up-contracts/pinned-contracts/${chainId}/${contractAddress}`)

    try {
        const list = await plugin.call('fileManager', 'readdir', `.looked-up-contracts/pinned-contracts/${chain.chainId}`)
        const contractAddressFilePaths = Object.keys(list)

        for (const contractAddressFilePath of contractAddressFilePaths) {
            const list = await plugin.call('fileManager', 'readdir', contractAddressFilePath)
            const contractInstanceFilePaths = Object.keys(list)

            for (const file of contractInstanceFilePaths) {
                const pinnedContract = await plugin.call('fileManager', 'readFile', file)
                const pinnedContractObj: ContractInstance = JSON.parse(pinnedContract)
                pinnedContractObj.isPinned = true

                if (pinnedContractObj) setInstanceAction(pinnedContractObj)
            }
        }
    } catch (err) {
        console.log(err)
    }
}

//contractData?: ContractData,
export const setInstanceAction = (instance: ContractInstance) => {
    dispatch({
        type: SET_INSTANCE,
        payload: instance
    })
}

export const pinInstanceAction = (index: number, pinnedTimestamp: number) => {
    dispatch({
        type: PIN_INSTANCE,
        payload: {
            index,
            pinnedTimestamp
        }
    })
}

export const unpinInstanceAction = (index: number) => {
    dispatch({
        type: UNPIN_INSTANCE,
        payload: {
            index
        }
    })
}

export const removeInstanceAction = (index: number) => {
    dispatch({
        type: REMOVE_INSTANCE,
        payload: {
            index
        }
    })
}

export const clearInstancesAction = () => {
    dispatch({
        type: CLEAR_INSTANCES
    })
}

export const setSelectedAccountAction = (selectedAccount: string) => {
    dispatch({
        type: SET_SELECTED_ACCOUNT,
        payload: selectedAccount
    })
}

export const setSendValue = (sendValue: string) => {
    dispatch({
        type: SET_SEND_VALUE,
        payload: sendValue
    })
}

export const setSendUnit = (sendUnit: string) => {
    dispatch({
        type: SET_SEND_UNIT,
        payload: sendUnit
    })
}

export const setGasLimit = (gasLimit: number) => {
    dispatch({
        type: SET_GAS_LIMIT,
        payload: gasLimit
    })
}

