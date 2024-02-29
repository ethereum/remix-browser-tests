import { ReadCommitResult } from "isomorphic-git"
import React, { useEffect, useState } from "react";
import { Accordion } from "react-bootstrap";
import { CommitDetailsNavigation } from "../../navigation/commitdetails";
import { gitActionsContext } from "../../../state/context";
import { gitPluginContext } from "../../gitui";
import { CommitDetailsItems } from "./commitdetailsitem";

export interface CommitDetailsProps {
  commit: ReadCommitResult;
  checkout: (oid: string) => void;
}

export const CommitDetails = (props: CommitDetailsProps) => {
  const { commit, checkout } = props;
  const actions = React.useContext(gitActionsContext)
  const context = React.useContext(gitPluginContext)
  const [activePanel, setActivePanel] = useState<string>("");

  useEffect(() => {
    console.log(commit)
    if (activePanel === "0") {
      console.log(commit.oid, commit.commit.parent)
      actions.getCommitChanges(commit.oid, commit.commit.parent[0])
    }
  }, [activePanel])

  return (<Accordion activeKey={activePanel} defaultActiveKey="">
    <CommitDetailsNavigation commit={commit} checkout={checkout} eventKey="0" activePanel={activePanel} callback={setActivePanel} />
    <Accordion.Collapse className="pl-2 border-left ml-1" eventKey="0">
      <>
        {context.commitChanges && context.commitChanges.filter(
          (change) => change.hashModified === commit.oid && change.hashOriginal === commit.commit.parent[0]
        ).map((change, index) => {
          return(<CommitDetailsItems key={index} commitChange={change}></CommitDetailsItems>)
        })}

      </>
    </Accordion.Collapse>
  </Accordion>)
}