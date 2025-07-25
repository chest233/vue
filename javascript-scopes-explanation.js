/**
 * Chrome 开发者工具中 [[Scopes]] 的不同作用域类型解释
 * 
 * 在 Chrome 控制台中，当你查看一个函数对象时，会看到 [[Scopes]] 属性。
 * 这个属性显示了该函数可以访问的所有作用域链。
 * 
 * 主要的作用域类型包括：
 * 1. Script - 脚本作用域
 * 2. Block - 块级作用域
 * 3. Closure - 闭包作用域
 * 4. Local - 局部作用域
 * 5. Global - 全局作用域
 */

// ========== 1. Script 作用域 ==========
// Script 作用域是在模块或脚本文件顶层声明的变量所在的作用域
// 它介于全局作用域和函数作用域之间

// 这些变量在 script 作用域中
const scriptVariable = 'I am in script scope';
let anotherScriptVar = 42;

function showScriptScope() {
    console.log(scriptVariable); // 可以访问 script 作用域的变量
    // 在控制台查看这个函数的 [[Scopes]]，你会看到 Script 作用域
    debugger;
}

// ========== 2. Block 作用域 ==========
// Block 作用域是由花括号 {} 创建的，配合 let/const 使用

function demonstrateBlockScope() {
    let outerVariable = 'outer';
    
    if (true) {
        // 这个块创建了一个新的作用域
        let blockVariable = 'I am in block scope';
        const blockConstant = 100;
        
        function innerFunction() {
            // 这个函数可以访问 block 作用域中的变量
            console.log(blockVariable);
            console.log(blockConstant);
            // 在控制台查看这个函数的 [[Scopes]]，你会看到 Block 作用域
            debugger;
        }
        
        innerFunction();
    }
    
    // 在块外部无法访问块级作用域的变量
    // console.log(blockVariable); // ReferenceError
}

// ========== 3. Closure 闭包作用域 ==========
// 当内部函数引用外部函数的变量时，会创建闭包

function createClosure() {
    let closureVariable = 'I am captured in closure';
    let count = 0;
    
    // 返回的函数会保持对外部变量的引用
    return function() {
        count++;
        console.log(closureVariable, count);
        // 在控制台查看这个函数的 [[Scopes]]，你会看到 Closure 作用域
        // Closure 作用域会显示被捕获的变量
        debugger;
    };
}

const closureExample = createClosure();

// ========== 4. Local 作用域 ==========
// Local 作用域是函数执行时的局部作用域，包含函数的参数和局部变量

function demonstrateLocalScope(parameter1, parameter2) {
    // 这些都在 Local 作用域中
    let localVariable = 'local';
    const localConstant = 'constant';
    
    // 当函数执行到这里时，Local 作用域包含：
    // - parameter1, parameter2 (参数)
    // - localVariable, localConstant (局部变量)
    // - arguments 对象
    // - this 值
    debugger;
    
    return localVariable;
}

// ========== 5. Global 作用域 ==========
// 全局作用域包含所有全局变量和函数

var globalVariable = 'I am global';
window.globalFromWindow = 'Also global';

function accessGlobalScope() {
    console.log(globalVariable);
    console.log(window.globalFromWindow);
    // 在控制台查看这个函数的 [[Scopes]]，你会看到 Global 作用域
    debugger;
}

// ========== 复杂示例：多层作用域 ==========
// 这个例子展示了多个作用域类型如何嵌套

const moduleLevel = 'module'; // Script 作用域

function complexExample() {
    const functionLevel = 'function'; // 将在闭包中被捕获
    
    {
        let blockLevel = 'block'; // Block 作用域
        
        return function innerFunction(param) { // param 在 Local 作用域
            const innerLocal = 'inner local'; // Local 作用域
            
            // 这个函数的 [[Scopes]] 会显示：
            // - Local: { param, innerLocal, arguments, this }
            // - Block: { blockLevel }
            // - Closure: { functionLevel }
            // - Script: { moduleLevel, scriptVariable, ... }
            // - Global: { globalVariable, window, ... }
            
            console.log(param, innerLocal, blockLevel, functionLevel, moduleLevel, globalVariable);
            debugger;
        };
    }
}

const complexFunc = complexExample();

// ========== 作用域链的实际应用 ==========

// 1. 使用闭包创建私有变量
function createCounter() {
    let privateCount = 0; // 这个变量会被保存在闭包中
    
    return {
        increment() {
            privateCount++;
            console.log(`Count: ${privateCount}`);
            debugger; // 查看 Closure 作用域中的 privateCount
        },
        
        decrement() {
            privateCount--;
            console.log(`Count: ${privateCount}`);
        }
    };
}

const counter = createCounter();

// 2. 块级作用域避免变量污染
function processData() {
    const data = [1, 2, 3, 4, 5];
    
    {
        // 使用块级作用域限制临时变量的范围
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i];
        }
        console.log('Sum:', sum);
    }
    
    // sum 和 i 在这里不可访问，避免了命名冲突
    
    {
        // 可以在另一个块中重用相同的变量名
        let sum = 1;
        for (let i = 0; i < data.length; i++) {
            sum *= data[i];
        }
        console.log('Product:', sum);
    }
}

// ========== 如何在控制台中查看作用域 ==========
console.log(`
如何查看函数的作用域：

1. 打开 Chrome 开发者工具 (F12)
2. 在控制台中运行这些函数
3. 使用 console.dir() 查看函数对象：
   - console.dir(showScriptScope)
   - console.dir(closureExample)
   - console.dir(complexFunc)

4. 展开函数对象，查看 [[Scopes]] 属性

5. 或者运行函数，当遇到 debugger 语句时，
   在 Sources 面板的 Scope 窗格中查看当前作用域链

试试运行这些示例：
- showScriptScope()
- demonstrateBlockScope()
- closureExample()
- demonstrateLocalScope('arg1', 'arg2')
- complexFunc('test')
- counter.increment()
`);

// ========== 作用域类型总结 ==========
/*
作用域类型及其特点：

1. Script 作用域：
   - 模块或脚本文件的顶层作用域
   - 使用 let/const 在文件顶层声明的变量
   - 介于全局和局部之间，不会污染全局对象

2. Block 作用域：
   - 由 {} 创建，配合 let/const 使用
   - 常见于 if、for、while 等语句块中
   - 提供更精细的变量作用域控制

3. Closure 闭包作用域：
   - 当内部函数引用外部函数的变量时创建
   - 保存被引用的外部变量
   - 即使外部函数执行完毕，变量仍然可访问

4. Local 局部作用域：
   - 函数执行时的作用域
   - 包含参数、局部变量、arguments、this
   - 函数执行完毕后销毁

5. Global 全局作用域：
   - 最外层的作用域
   - 浏览器中对应 window 对象
   - 包含所有全局变量和函数

作用域链查找顺序：
Local -> Block -> Closure -> Script -> Global

理解这些作用域类型对于：
- 调试代码
- 理解变量访问
- 避免命名冲突
- 优化内存使用
- 编写更好的代码结构
都非常重要。
*/