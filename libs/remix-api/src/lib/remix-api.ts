import { IGitApi } from "@remix-ui/git"
import { IRemixApi } from "@remixproject/plugin-api"
import { StatusEvents } from "@remixproject/plugin-utils"
import { IConfigApi } from "./plugins/config-api"
import { IFileDecoratorApi } from "./plugins/filedecorator-api"
import { IExtendedFileSystem } from "./plugins/fileSystem-api"
import { INotificationApi } from "./plugins/notification-api"
import { ISettings } from "./plugins/settings-api"

export interface ICustomRemixApi extends IRemixApi {
  dgitApi: IGitApi
  config: IConfigApi
  notification: INotificationApi
  settings: ISettings
  fileDecorator: IFileDecoratorApi
  fileManager: IExtendedFileSystem
}

export declare type CustomRemixApi = Readonly<ICustomRemixApi>