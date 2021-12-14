import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'
// 此处不用 class 的原因是, 方便后续给 Vue 实例混入实例成员
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue)  // 注册 vm 的 _init 方法, 初始化 vm
stateMixin(Vue) // 注册 vm 的 $data $props $set $delete $wath
eventsMixin(Vue) // 初始化事件的相关方法 $on $once $off $emit
lifecycleMixin(Vue) // _update $forceUpdate $destroy
renderMixin(Vue)  // $nextTice _render

export default Vue
