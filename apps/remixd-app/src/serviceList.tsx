import { useEffect } from "react";
import { IAppState } from "./state";

interface ServiceListProps {
  state: IAppState
}
export function ServiceList(props: ServiceListProps) {
  const { state } = props;

  useEffect(() => {
    console.log('state', state);
    if (state)
      Object.keys(state.socketConnectionState).map((name) => {
        console.log('socketConnectionState', name, state.socketConnectionState[name]);
      })
  }, [state]);

  return (
    <>{
      state && Object.keys(state.socketConnectionState).map((name) => {
        return (
          <>
            <div key={name}>
             {state.socketConnectionState[name].connected ? `${name} connected` : ''} 
             {state.socketConnectionState[name].listening && !state.socketConnectionState[name].connected ? `${name} listening` : ''}
            </div>
          </>)
      })
    }
    </>
  );
}