/* @flow */

import {
  warn,
  remove,
  isObject,
  parsePath,
  _Set as Set,
  handleError,
  invokeWithErrorHandling,
  noop
} from '../util/index'

import { traverse } from './traverse'
import { queueWatcher } from './scheduler'
import Dep, { pushTarget, popTarget } from './dep'

import type { SimpleSet } from '../util/index'

let uid = 0

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
// RenderWatcher,$watch, computed 创建 watcher 观察者,赋值 dep.Target, 触发 getter 收集依赖
// Watcher 的原理是通过对“被观测目标”的求值，触发数据属性的 get 拦截器函数从而收集依赖，
// 至于“被观测目标”到底是表达式还是函数或者是其他形式的内容都不重要，重要的是“被观测目标”能否触发数据属性的 get 拦截器函数，
// 很显然函数是具备这个能力的。
// !!! ==== 触发 getter !!! ====
export default class Watcher {
  vm: Component;
  expression: string;
  cb: Function;
  id: number;
  deep: boolean;
  user: boolean;
  lazy: boolean;
  sync: boolean;
  dirty: boolean;
  active: boolean;
  deps: Array<Dep>;
  newDeps: Array<Dep>;
  depIds: SimpleSet;
  newDepIds: SimpleSet;
  before: ?Function;
  getter: Function;
  value: any;

  constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
  ) {
    this.vm = vm
    if (isRenderWatcher) {
      vm._watcher = this
    }
    vm._watchers.push(this)
    // options
    if (options) {
      //
      this.deep = !!options.deep // 当前观察者实例对象是否是深度观测
      this.user = !!options.user // 当前观察者实例对象是 开发者定义的 还是 内部定义的
      this.lazy = !!options.lazy // 当前观察者实例对象是否是计算属性的观察者
      this.sync = !!options.sync // 数据变化时是否同步求值并执行回调
      this.before = options.before // 可以理解为 Watcher 实例的钩子，当数据变化之后，触发更新之前
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb
    this.id = ++uid // uid for batching
    this.active = true
    this.dirty = this.lazy // for lazy watchers
    this.deps = []  // 存储的是上一次求值过程中所收集到的 Dep 实例对象
    this.newDeps = [] // 一次求值中收集的依赖, 每次求值后都会清空
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = process.env.NODE_ENV !== 'production'
      ? expOrFn.toString()
      : ''
    // parse expression for getter
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = noop
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }
    this.value = this.lazy
      ? undefined
      : this.get()
  }

  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  // 它的作用可以用两个字描述：求值。求值的目的有两个，
  // 第一个是能够触发访问器属性的 get 拦截器函数，
  // 第二个是能够获得被观察目标的值。
  get () {
    /*
    * pushTarget 在 this.getter 之前执行了
    * 保证了 Dep.target 是有值的
    * 执行 this.getter 的时候在 expOrFn 中触发 defineReactive 中 getter ,Dep.target是有值的 能够手机依赖 (dep.depend())
    * **/
    pushTarget(this) // 1.targetStack.push(target); 2.Dep.target = target
    let value
    const vm = this.vm
    try {
      // 对于渲染函数的观察者来讲，重新求值其实等价于重新执行渲染函数，最终结果就是重新生成了虚拟DOM并更新真实DOM，这样就完成了重新渲染的过程
      value = this.getter.call(vm, vm)
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) {
        traverse(value)
      }
      popTarget()
      this.cleanupDeps()
    }
    return value  // value(也就是 this.value) 属性保存着被观察目标的值
  }

  /**
   * Add a dependency to this directive.
   */
  /**
   * mountComponent ==> new Watcher ==> constructor ==> tihs.value = get() ===> pushTarget(this) & getter()
   * getter 执行 expOrFn (可能是 updateComponent 触发 render 触发 reactiveGetter 或者是 parsePath(expOrFn) 中触发 reactiveGetter)
   * reactiveGetter中 dep.depend ==> if(Dep.target)Dep.target.addDep(this:Watcher) ===> 判断 newDeps,ids 等 ==> dep.addSub(this) ==> this.subs.push(sub)
   * ==> finally popTarget & this.cleanupDeps()
   * */
  addDep (dep: Dep) {
    const id = dep.id
    /**
    * 避免收集重复依赖
    * 比如: 一个组件中中两处用到 name <div id="demo">{{name}}{{name}}</div>
    * 那么在编译为 render 后, 触发2次reactiveGetter,收集2次依赖
    * function anonymous () {
        with (this) {
          return _c('div',
            { attrs:{ "id": "demo" } },
            [_v("\n      "+_s(name)+_s(name)+"\n    ")]
          )
        }
      }
    */

    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        dep.addSub(this) // ==> this.subs.push(sub:Watcher)
      }
    }
  }

  /**
   * Clean up for dependency collection.
   */
  /**
  * 1、newDepIds 属性用来在一次求值中避免收集重复的观察者
  * 2、每次求值并收集观察者完成之后会清空 newDepIds 和 newDeps 这两个属性的值，并且在被清空之前把值分别赋给了 depIds 属性和 deps 属性
  * 3、depIds 属性用来避免重复求值时收集重复的观察者
  */
  cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  update () {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      this.run()
    } else {
      queueWatcher(this)
    }
  }

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  run () {
    if (this.active) {
      const value = this.get()
      // 对于渲染函数的观察者来讲并不会执行这个 if 语句块，
      // 因为 this.get 方法的返回值其实就等价于 updateComponent 函数的返回值，这个值将永远都是 undefined
      // 实际上 if 语句块内的代码是为非渲染函数类型的观察者准备的，它用来对比新旧两次求值的结果，当值不相等的时候会调用通过参数传递进来的回调
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        const oldValue = this.value
        this.value = value
        // this.user 为真意味着这个观察者是开发者定义的，所谓开发者定义的是指那些通过 watch 选项或 $watch 函数定义的观察者，
        // 这些观察者的特点是回调函数是由开发者编写的，所以这些回调函数在执行的过程中其行为是不可预知的，很可能出现错误，这时候将其放到一个 try...catch 语句块中
        if (this.user) {
          const info = `callback for watcher "${this.expression}"`
          invokeWithErrorHandling(this.cb, this.vm, [value, oldValue], this.vm, info)
        } else {
          this.cb.call(this.vm, value, oldValue)
        }
      }
    }
  }

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  evaluate () {
    this.value = this.get()
    this.dirty = false
  }

  /**
   * Depend on all deps collected by this watcher.
   */
  depend () {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   */
  teardown () {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this)
      }
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      this.active = false
    }
  }
}
/**
 * 假设我们有如下模板：
 * <div id="demo">
 *   {{name}}
 * </div>
 * 我们知道这段模板将会被编译成渲染函数，接着创建一个渲染函数的观察者，从而对渲染函数求值，在求值的过程中会触发数据对象 name 属性的 get 拦截器函数，
 * 进而将该观察者收集到 name 属性通过闭包引用的“筐”中，即收集到 Dep 实例对象中。这个 Dep 实例对象是属于 name 属性自身所拥有的，
 * 这样当我们尝试修改数据对象 name 属性的值时就会触发 name 属性的 set 拦截器函数，这样就有机会调用 Dep 实例对象的 notify 方法，
 * 从而触发了响应，如下代码截取自 defineReactive 函数中的 set 拦截器函数 ,最终 dep.notify()
 *
 * */
