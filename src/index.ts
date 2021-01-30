import { pluginFactory } from './plugin'
import type { PluginUtils } from "./vendor/playground"

const makePlugin = (utils: PluginUtils) => {
  return pluginFactory(utils);
}

export default makePlugin
