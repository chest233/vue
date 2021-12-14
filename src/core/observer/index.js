/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'
// arrayKeys 是这样的数组 ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse']
const arrayKeys = Object.getOwnPropertyNames(arrayMethods)
/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
export let shouldObserve: boolean = true

export function toggleObserving (value: boolean) {
  shouldObserve = value
}

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value // value 属性指向数据对象本身，这是一个循环引用
    /*
    * dep 它就是一个收集依赖的“筐”
    * 但这个“筐”并不属于某一个字段
    * 这个筐是属于当前对象或数组的, 由于收集 添加删除字段 依赖的
    **/
    this.dep = new Dep()
    this.vmCount = 0
    /**
     * __ob__ 属性以及 __ob__.dep 的主要作用
     * 是为了添加、删除属性时有能力触发依赖，而这就是 Vue.set 或 Vue.delete 的原理
     * */
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      if (hasProto) {
        // 支持 __proto__ 的情况, 设置 value 的 __proto__ 为 arrayMethods
        protoAugment(value, arrayMethods)
      } else {
        // 不支持 __proto__ 的情况, 直接给 value 数组上设置 push pop 等属性(不可枚举的)
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
/**
 * const data = {a: {b: 1}} 经 observe 处理后 ↓↓↓
 * const data = {
    // 属性 a 通过 setter/getter 通过闭包引用着 dep 和 childOb
    a: {
      // 属性 b 通过 setter/getter 通过闭包引用着 dep 和 childOb
      b: 1,
      get b(){},
      set b(){},
      __ob__: {a, dep, vmCount}
    },
    get a(){},
    set a(){},
    __ob__: {data, dep, vmCount}
  }
 * a 中 getteer/setter 闭包引用的 childOb, 就是 data.a.__ob__
 * 而 b 闭包引用的 childOb 是 undefined, 因为 b 是基本类型
 * */
// 数据只能处理 {} 或 [], 才能处理成响应式数据 ,基本类型返回 undefined
export function observe (value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    shouldObserve &&  // 先理解为一个开关
    !isServerRendering() && // 不是 ssr
    (Array.isArray(value) || isPlainObject(value)) && // 是个数组 或者 或者是个对象
    Object.isExtensible(value) && // 没被执行过 Object.preventExtensions()、Object.freeze() 以及 Object.seal()
    !value._isVue // vm._isVue 为真, 这里是为了避免观测 Vue 实例对象
  ) {
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 * 核心作用是 将数据对象的数据属性转换为访问器属性
 * 即为数据对象的属性设置一对 getter/setter
 * 单独对要转化成响应式数据的 每一个 字段的处理
 * 每一个数据字段都通过闭包引用着属于自己的 dep 常量 (在 gettrr/setter 中引用)
 */
export function defineReactive (
  obj: Object,
  key: string,
  val: any, // 在 $set,$del 中调用需要这个参数， 因为用 obj[key] 取不到
  customSetter?: ?Function,
  shallow?: boolean
) {
  // 这里才是真正的"筐"的作用
  // 每一个字段都有一个自己对应的"筐"
  const dep = new Dep()

  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  // 提供预定义的访问器属性, 有可能用户传入的值有 getter/setter
  const getter = property && property.get
  const setter = property && property.set
  //
  /**
   * (!getter || setter)
   * 1. !getter : 之所以在深度观测之前不取值是因为属性原本的 getter 由用户定义，
   * 用户可能在 getter 中做任何意想不到的事情，这么做是出于避免引发不可预见行为的考虑
   * 2. setter:  我们知道当数据对象的某一个属性只拥有 get 拦截器函数而没有 set 拦截器函数时，此时该属性不会被深度观测。
   * 但是经过 defineReactive 函数的处理之后，该属性将被重新定义 getter 和 setter，此时该属性变成了既拥有 get 函数又拥有 set 函数。
   * 并且当我们尝试给该属性重新赋值时，那么新的值将会被观测。这时候矛盾就产生了：原本该属性不会被深度观测，但是重新赋值之后，新的值却被观测了
   * 这就是所谓的 定义响应式数据时行为的不一致，
   * 为了解决这个问题，采用的办法是当属性拥有原本的 setter 时，即使拥有 getter 也要获取属性值并观测之，这样代码就变成了最终这个样子
   * 总结: 没有 getter 允许深度监听 或 虽然有 getter 但是有 setter 允许深度监听
   * */
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }
  /**
   * val 本身有可能也是一个对象
   * 那么此时应该继续调用 observe(val) 函数观测该对象从而深度观测数据对象
   * 有$attrs, $listeners 是非深度检测(shallow为true)的情况
   * childOb 也被 getter 和 setter 闭包引用着
   * */
  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    /*
    * 当我们访问这个属性的时候, 会进行依赖收集
    * 把依赖该属性的 watcher 对象添加到 dep 对象的 subs 数组中
    * 将来数据发生变化的时候, 通知所有的 watcher
    * **/
    get: function reactiveGetter () {
      // 如果有预定义的 getter, 则调用预定义的 getter
      const value = getter ? getter.call(obj) : val
      // Dep.target: 当前依赖目标, 即 watcher 对象, 即将要被收集的依赖
      // 在某处 watcher 被触发了 ,Dep.target 赋了值, 再触发次 getter 时,进入 if
      if (Dep.target) {
        /**
         * 这里闭包引用了上面的 dep
         * 进行依赖收集, 放进"筐"里---> 把当前的 watcher 对象, 添加到 dep 对象的 subs 数组中
         * dep.depend(), childOb.dep.depend(), 收集了2次相同的依赖(都是Dep.target)
         * 因为 一个"筐"是dep:在 setter 中触发,即直接修改属性值     【直接修改 这个属性】 var o={a：1}; o={}
         * 一个"筐"是childOb.dep,即调 Vue.set, vm.$set 触发      【给这个属性 添加新属性】 var o={a:1}; o.b=2
         * */
        dep.depend()
        if (childOb) {
          childOb.dep.depend()  // childOb 就是__ob__, 为了出发 vm.$set 的
          if (Array.isArray(value)) {
            // 这里是为了 vm.$set(vm.arr[0], 'msg', 'mrssage') 能出发响应式
            // 因为 observe 处理过程中，value 本身这一级的添加属性，是要在上一级的 childOb 收集依赖的
            // 虽然在 observeArray 中遍历 observe 了每一个 item 对象，但是没法处理到 item 对象本身这一级的 $set
            // 而 walk 则不同了， 它第一次 处理的 value 是最外层的大data（即_data，或者说$data）
            // 他是有机会处理除自己这一级外每一级的 $set 的
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      // || 后面的表达式是对 NaN 的处理, NaN 是不等于 NaN 的
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      // 设置的新值, 如果是 object 或 array, 重新进行观测,同时使用新的观测对象重写 childOb 的值
      childOb = !shallow && observe(newVal)
      dep.notify()  // 把"筐"里的依赖都执行一下, 这里也闭包引用了上面的 dep
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
/*
* 数组是用 修改过的 splice 实现
* 对象是 defineReactive(obj, key, value) 这里是传了第三个参数 value 的
* **/
export function set (target: Array<any> | Object, key: any, val: any): any {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val) // 这个是修改后的 splice 方法
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  if (!ob) {
    target[key] = val
    return val
  }
  defineReactive(ob.value, key, val)
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del (target: Array<any> | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}


/*
* 一个根数据进来(rootData), 肯定是 {} 形式
* 1. observe 开始响应式处理, 一些判断后开始 new Observer(), 并且准备返回一个 Observer 实例(即 childOB, __ob__)
* 2. new Observer(), 给这个数据(第一次是rootData)添加 __ob__(dep---此 dep 是直接 new Dep()获得的,value,vmCount)
* 3. walk 遍历这个数据(第一次是rootData), 每一个属性, 然后调用 defineReactive
* 4. defineReactive 为这一个属性创建 dep, 判断这个属性是不是引用类型--> 是引用类型递归调用 observe,  获取 childOB
* ,给这个属性添加 getter/setter,getter/setter 中闭包引用着 dep 和 childOB
*
* **/
