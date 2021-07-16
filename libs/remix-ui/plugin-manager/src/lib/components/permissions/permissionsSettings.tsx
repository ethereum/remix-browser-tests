import React, { Fragment, useState } from 'react'
import { RemixUiCheckbox } from '@remix-ui/checkbox'
import { PluginManagerSettings } from '../../../types'
import { ModalDialog } from '@remix-ui/modal-dialog'

interface PermissionSettingsProps {
  pluginSettings: PluginManagerSettings
  toPlugin?: string
  funcObj?: {}
  methodName?: string
  fromPlugins?: {}

}

// <div className="form-group remixui_permissionKey">
//   <div className="remixui_checkbox">
//     {fromPluginPermission.allow
//       ? <span className="mr-2">
//         <RemixUiCheckbox
//           checked
//           onClick={() => togglePermission(fromName, toPlugin, methodName)}
//           inputType="checkbox"
//           id={`permission-checkbox-${toPlugin}-${methodName}-${toPlugin}`}
//           aria-describedby={`module ${fromPluginPermission} asks permission for ${methodName}`}
//         />
//       </span>
//       : <span className="mr-2">
//         <RemixUiCheckbox
//           checked={false}
//           onClick={() => togglePermission(fromName, toPlugin, methodName)}
//           inputType="checkbox"
//           id={`permission-checkbox-${toPlugin}-${methodName}-${toPlugin}`}
//           aria-describedby={`module ${fromPluginPermission} asks permission for ${methodName}`}
//         />
//       </span>
//     }
//     <label
//       htmlFor={`permission-checkbox-${toPlugin}-${methodName}-${toPlugin}`}
//       data-id={`permission-label-${toPlugin}-${methodName}-${toPlugin}`}
//     >
//         Allow <u>{fromName}</u> to call <u>{methodName}</u>
//     </label>
//   </div>
//   <i onClick={() => pluginSettings.clearPersmission(fromName, toPlugin, methodName)} className="fa fa-trash-alt" data-id={`pluginManagerSettingsRemovePermission-${toPlugin}-${methodName}-${toPlugin}`}></i>
// </div>

function PermisssionsSettings ({ pluginSettings }: PermissionSettingsProps) {
  /**
   * Declare component local state
   */
  const [modalVisibility, setModalVisibility] = useState<boolean>(true)
  const toPluginP = ''
  const fromName = ''
  const methodName = ''
  const openModal = () => setModalVisibility(false)
  const closeModal = () => setModalVisibility(true)

  const togglePermission = (fromPlugin: string, toPlugin: string, methodName: string) => {
    pluginSettings.permissions[toPlugin][methodName][fromPlugin].allow = !pluginSettings.permissions[toPlugin][methodName][fromPlugin].allow
  }

  return (
    <Fragment>
      <ModalDialog
        handleHide={closeModal}
        hide={modalVisibility}
        title="Plugin Manager Permissions"
      >
        <div className="border p-2">
          <div className="pb-2 remixui_permissionKey">
            <h3>toPlugin permissions:</h3>
            <i onClick={() => pluginSettings.clearAllPersmission(toPluginP)} className="far fa-trash-alt" data-id={`pluginManagerSettingsClearAllPermission-${toPluginP}`}></i>
          </div>
          <form className="remixui_permissionForm" data-id="pluginManagerSettingsPermissionForm">
            <h4>No Permission requested yet.</h4>
            <div className="form-group remixui_permissionKey">
              <div className="remixui_checkbox">
                {/* ${checkbox} */}
                <label htmlFor="permission-checkbox-{toPlugin}-{methodName}-{toPlugin}" data-id="permission-label-{toPlugin}-{methodName}-{toPlugin}">Allow <u>{fromName}</u> to call <u>{methodName}</u></label>
              </div>
              <i onClick={() => pluginSettings.clearPersmission(fromName, toPluginP, methodName)} className="fa fa-trash-alt" data-id={`pluginManagerSettingsRemovePermission-${toPluginP}-${methodName}-${toPluginP}`}></i>
            </div>
          </form>
        </div>
      </ModalDialog>
      <footer className="bg-light remixui_permissions remix-bg-opacity">
        <button
          onClick={() => setModalVisibility(!modalVisibility)}
          className="btn btn-primary settings-button"
          data-id="pluginManagerPermissionsButton">
          Permissions
        </button>
      </footer>
    </Fragment>
  )
}
export default PermisssionsSettings
