import { CloudFileManager } from './cloud-file-manager'

import '../style/app.styl'

const instance = new CloudFileManager()
export default instance;
(global as any).CloudFileManager = instance
