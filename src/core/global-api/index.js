/* @flow */

import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { ASSET_TYPES } from 'shared/constants'
import builtInComponents from '../components/index'
import { observe } from 'core/observer/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

export function initGlobalAPI (Vue: GlobalAPI) {
  // config
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  // 2.6 explicit observable API
  Vue.observable = <T>(obj: T): T => {
    observe(obj)
    return obj
  }

  Vue.options = Object.create(null)
  // ASSET_TYPES ===> 为 'component', 'directive', 'filter' 创建 空对象
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue   // 标识 "base" Vue 构造函数, (不是 Vue.extend() 创建出来的)

  // 注册 keep-alive 组件 (他不是与平台相关的, 所以不放在 web 下)
  extend(Vue.options.components, builtInComponents)

  initUse(Vue)  // 注册 Vue.use() 插件
  initMixin(Vue)  // 注册 Vue.mixin() 混入
  initExtend(Vue) // 注册 Vue.extend() 基于传入的 options 返回一个组件的构造函数
  initAssetRegisters(Vue) // 注册 Vue.directive(), Vue.component(), Vue.filter()
}
