import { Utils } from '@aleph-indexer/core'

export class DiscovererFactory extends Utils.AsyncModuleFactory {
  static async importModule(moduleId: string): Promise<any> {
    return import(`./impl/${moduleId}.js`)
  }
}

export default DiscovererFactory
