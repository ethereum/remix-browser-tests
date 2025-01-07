import { ContractInstance } from "../types";

export const appInitialState: State = {
  loading: { screen: true },
  contractInstances: [],
  interaction_environment: {
    sendValue: '0',
    sendUnit: 'wei',
    gasLimit: 3000000,
    proxyAddress: '',
    error: '',
    selectedAccount: '',
    // TODO
    accounts: {
      loadedAccounts: {},
      isRequesting: false,
      isSuccessful: false,
      error: null,
      selectedAccount: ''
    },
  },
  // isRequesting: false,
  // isSuccessful: false,
  // terminal: { journalBlocks: [], hidden: false, height: 250 },
};

export interface State {
  loading: { screen: boolean },
  contractInstances: ContractInstance[]
  interaction_environment: InteractionEnvironment
};

export interface InteractionEnvironment {
  sendValue: string,
  sendUnit: string,
  gasLimit: number,
  proxyAddress: string,
  error: string | null,
  selectedAccount: string,
  // TODO
  accounts: {
    loadedAccounts: {},
    isRequesting: boolean,
    isSuccessful: boolean,
    error: string | null,
    selectedAccount: string
  },
  // isRequesting: boolean,
  // isSuccessful: boolean,
}

export type ActionType = 'SET_LOADING' | 'SET_INSTANCE' | 'SET_SETTINGS' | 'SET_TERMINAL' | 'PIN_INSTANCE' | 'UNPIN_INSTANCE' | 'REMOVE_INSTANCE' | 'CLEAR_INSTANCES' | 'SET_SELECTED_ACCOUNT' | 'SET_SEND_VALUE' | 'SET_SEND_UNIT' | 'SET_GAS_LIMIT';

export const SET_LOADING: ActionType = 'SET_LOADING';
export const SET_INSTANCE: ActionType = 'SET_INSTANCE';
export const SET_SETTINGS: ActionType = 'SET_SETTINGS';
export const SET_TERMINAL: ActionType = 'SET_TERMINAL';
export const PIN_INSTANCE: ActionType = 'PIN_INSTANCE';
export const UNPIN_INSTANCE: ActionType = 'UNPIN_INSTANCE';
export const REMOVE_INSTANCE: ActionType = 'REMOVE_INSTANCE';
export const CLEAR_INSTANCES: ActionType = 'CLEAR_INSTANCES';
export const SET_SELECTED_ACCOUNT: ActionType = 'SET_SELECTED_ACCOUNT';
export const SET_SEND_VALUE: ActionType = 'SET_SEND_VALUE';
export const SET_SEND_UNIT: ActionType = 'SET_SEND_UNIT';
export const SET_GAS_LIMIT: ActionType = 'SET_GAS_LIMIT';

export type Action =
  {
    type: ActionType,
    payload: any
  };

export const appReducer = (state = appInitialState, action: Action): State => {
  switch (action.type) {
    case SET_LOADING:
      return {
        ...state,
        loading: { ...state.loading, ...action.payload },
      };

    case SET_INSTANCE:
      return {
        ...state,
        contractInstances: [...state.contractInstances, action.payload],
      };

    case REMOVE_INSTANCE: {
      const payload: { index: number } = action.payload
      return {
        ...state,
        contractInstances: state.contractInstances.filter((_, index) => index !== payload.index)
      }
    }

    case CLEAR_INSTANCES: {
      return {
        ...state,
        contractInstances: []
      }
    }

    case PIN_INSTANCE: {
      const payload: { index: number, pinnedTimestamp: number } = action.payload
      state.contractInstances[payload.index].isPinned = true
      state.contractInstances[payload.index].pinnedTimestamp = payload.pinnedTimestamp
      return {
        ...state,
        contractInstances: [
          ...state.contractInstances,
        ]
      }
    }

    case UNPIN_INSTANCE: {
      const payload: { index: number } = action.payload
      state.contractInstances[payload.index].isPinned = false
      return {
        ...state,
        contractInstances: [
          ...state.contractInstances,
        ]
      }
    }

    case SET_SELECTED_ACCOUNT:
      return {
        ...state,
        interaction_environment: { ...state.interaction_environment, selectedAccount: action.payload },
      };

    case SET_SEND_VALUE:
      return {
        ...state,
        interaction_environment: { ...state.interaction_environment, sendValue: action.payload },
      };

    case SET_SEND_UNIT:
      return {
        ...state,
        interaction_environment: { ...state.interaction_environment, sendUnit: action.payload }
      };

    case SET_GAS_LIMIT:
      return {
        ...state,
        interaction_environment: { ...state.interaction_environment, gasLimit: action.payload },
      };

    // case UPDATE_INSTANCES_BALANCE: {
    //   const payload: Array<{ contractData: ContractData, address: string, balance: number, name: string, abi?: any, decodedResponse?: Record<number, any> }> = action.payload
    //   return {
    //     ...state,
    //     instances: {
    //       ...state.instances,
    //       instanceList: payload
    //     }
    //   }
    // }

    // case 'SET_SETTINGS':
    //   return {
    //     ...state,
    //     settings: { ...state.settings, ...action.payload },
    //   };

    // case 'SET_TERMINAL':
    //   return {
    //     ...state,
    //     terminal: { ...state.terminal, ...action.payload },
    //   };

    default:
      throw new Error("Invalid action type");
  }
};
