// JavaScript 作用域相关概念详解

// ==================== 1. 作用域（Scope） ====================
/*
作用域定义了变量和函数的可访问范围。JavaScript有以下几种作用域：
- 全局作用域：在代码的任何地方都能访问
- 函数作用域：在函数内部声明的变量只能在函数内部访问
- 块级作用域：在代码块内声明的变量（使用let/const）只能在块内访问
*/

// 全局作用域
var globalVar = "我是全局变量";

function demonstrateScope() {
    // 函数作用域
    var functionVar = "我是函数作用域变量";
    
    if (true) {
        // 块级作用域
        let blockVar = "我是块级作用域变量";
        const blockConst = "我也是块级作用域";
        var functionScopedVar = "我虽然在块内，但属于函数作用域";
        
        console.log(globalVar);      // ✓ 可以访问
        console.log(functionVar);    // ✓ 可以访问
        console.log(blockVar);       // ✓ 可以访问
    }
    
    console.log(globalVar);          // ✓ 可以访问
    console.log(functionVar);        // ✓ 可以访问
    console.log(functionScopedVar);  // ✓ 可以访问
    // console.log(blockVar);        // ✗ 错误：blockVar is not defined
}

// ==================== 2. 作用域链（Scope Chain） ====================
/*
作用域链是指当查找变量时，会从当前作用域开始，逐级向上查找，
直到找到该变量或到达全局作用域为止。
*/

var globalName = "全局";

function outer() {
    var outerName = "外层";
    
    function middle() {
        var middleName = "中层";
        
        function inner() {
            var innerName = "内层";
            
            // 作用域链查找过程演示
            console.log(innerName);   // 在当前作用域找到
            console.log(middleName);  // 向上一层找到
            console.log(outerName);   // 向上两层找到
            console.log(globalName);  // 向上三层，在全局作用域找到
        }
        
        inner();
    }
    
    middle();
}

// ==================== 3. 执行上下文（Execution Context） ====================
/*
执行上下文是JavaScript代码执行的环境。有三种类型：
- 全局执行上下文：默认的、最基础的执行上下文
- 函数执行上下文：每次调用函数时创建
- Eval执行上下文：eval函数内部的代码执行时创建

执行上下文包含三个重要组成部分：
1. 变量对象（Variable Object）/ 活动对象（Activation Object）
2. 作用域链（Scope Chain）
3. this值
*/

// 执行上下文的创建过程演示
function executionContextDemo(param) {
    // 创建阶段：
    // 1. 创建变量对象
    // 2. 建立作用域链
    // 3. 确定this值
    
    var localVar = "局部变量";
    
    function innerFunc() {
        console.log(param);     // 可以访问参数
        console.log(localVar);  // 可以访问局部变量
    }
    
    // 执行阶段：
    // 变量赋值、函数引用、执行代码
    innerFunc();
}

// ==================== 4. 变量对象（VO）和活动对象（AO） ====================
/*
变量对象（Variable Object）是执行上下文中的数据存储容器，
存储了在上下文中定义的变量和函数声明。

活动对象（Activation Object）是函数执行上下文中的变量对象。
当函数被调用时，会创建一个活动对象，包含：
- 函数参数
- 内部变量声明
- 内部函数声明
*/

function demonstrateVO(a, b) {
    // 活动对象包含：
    // 1. arguments对象
    console.log(arguments); // { 0: 1, 1: 2, length: 2 }
    
    // 2. 函数参数
    console.log(a, b); // 1, 2
    
    // 3. 内部变量声明
    var localVar = 10;
    
    // 4. 内部函数声明
    function localFunc() {
        return "内部函数";
    }
    
    // 变量提升演示（声明提升到作用域顶部）
    console.log(hoistedVar); // undefined（而不是报错）
    var hoistedVar = "我被提升了";
    console.log(hoistedVar); // "我被提升了"
}

// ==================== 5. 闭包（Closure） ====================
/*
闭包是指有权访问另一个函数作用域中变量的函数。
闭包的本质是函数能够记住并访问它的词法作用域，
即使函数在其词法作用域之外执行。
*/

// 闭包示例1：基本闭包
function createCounter() {
    var count = 0; // 私有变量
    
    return function() {
        count++;
        return count;
    };
}

const counter1 = createCounter();
console.log(counter1()); // 1
console.log(counter1()); // 2
console.log(counter1()); // 3

const counter2 = createCounter(); // 新的闭包实例
console.log(counter2()); // 1（独立的count变量）

// 闭包示例2：多个闭包共享同一个作用域
function createGetterSetter() {
    var secret = "初始值";
    
    return {
        get: function() {
            return secret;
        },
        set: function(newValue) {
            secret = newValue;
        }
    };
}

const accessor = createGetterSetter();
console.log(accessor.get());  // "初始值"
accessor.set("新值");
console.log(accessor.get());  // "新值"

// 闭包示例3：循环中的闭包问题
function createFunctions() {
    var result = [];
    
    // 错误示例：所有函数共享同一个i
    for (var i = 0; i < 3; i++) {
        result.push(function() {
            return i; // 闭包捕获的是i的引用，不是值
        });
    }
    
    return result;
}

const funcs = createFunctions();
console.log(funcs[0]()); // 3（不是0）
console.log(funcs[1]()); // 3（不是1）
console.log(funcs[2]()); // 3（不是2）

// 正确的解决方案1：使用IIFE创建新的作用域
function createFunctionsCorrect1() {
    var result = [];
    
    for (var i = 0; i < 3; i++) {
        result.push((function(index) {
            return function() {
                return index;
            };
        })(i));
    }
    
    return result;
}

// 正确的解决方案2：使用let（块级作用域）
function createFunctionsCorrect2() {
    var result = [];
    
    for (let i = 0; i < 3; i++) {
        result.push(function() {
            return i;
        });
    }
    
    return result;
}

// ==================== 6. 综合示例：所有概念的协同工作 ====================
var globalConfig = { theme: "dark" };

function createApp(appName) {
    // 函数执行时创建执行上下文
    // 活动对象包含：appName参数、config变量、内部函数等
    
    var config = {
        name: appName,
        version: "1.0"
    };
    
    // 返回的对象中的方法形成闭包
    return {
        getName: function() {
            // 通过作用域链访问外部变量
            return config.name;
        },
        
        getTheme: function() {
            // 作用域链：当前函数 -> createApp函数 -> 全局
            return globalConfig.theme;
        },
        
        updateVersion: function(newVersion) {
            // 闭包可以修改外部作用域的变量
            config.version = newVersion;
        },
        
        getInfo: function() {
            // 访问整个配置对象
            return { ...config, theme: globalConfig.theme };
        }
    };
}

// 使用示例
const myApp = createApp("MyApplication");
console.log(myApp.getName());      // "MyApplication"
console.log(myApp.getTheme());     // "dark"
myApp.updateVersion("2.0");
console.log(myApp.getInfo());      // { name: "MyApplication", version: "2.0", theme: "dark" }

// 创建另一个应用实例，拥有独立的闭包
const anotherApp = createApp("AnotherApp");
console.log(anotherApp.getInfo()); // { name: "AnotherApp", version: "1.0", theme: "dark" }

// ==================== 7. 实际应用：模块模式 ====================
const Calculator = (function() {
    // 私有变量和方法（通过闭包实现）
    var result = 0;
    var history = [];
    
    function addToHistory(operation) {
        history.push(operation);
        if (history.length > 10) {
            history.shift(); // 只保留最近10条记录
        }
    }
    
    // 公共API（通过闭包访问私有变量）
    return {
        add: function(n) {
            result += n;
            addToHistory(`加 ${n}, 结果: ${result}`);
            return this;
        },
        
        subtract: function(n) {
            result -= n;
            addToHistory(`减 ${n}, 结果: ${result}`);
            return this;
        },
        
        multiply: function(n) {
            result *= n;
            addToHistory(`乘 ${n}, 结果: ${result}`);
            return this;
        },
        
        getResult: function() {
            return result;
        },
        
        getHistory: function() {
            return [...history]; // 返回副本，保护原数组
        },
        
        reset: function() {
            result = 0;
            history = [];
            return this;
        }
    };
})();

// 使用计算器模块
Calculator.add(10).subtract(5).multiply(2);
console.log(Calculator.getResult());  // 10
console.log(Calculator.getHistory());  // 显示操作历史

// ==================== 总结 ====================
/*
1. 作用域：定义了变量的可访问范围
2. 作用域链：变量查找的路径，从内到外
3. 执行上下文：代码执行的环境，包含变量对象、作用域链和this
4. 变量对象/活动对象：存储变量和函数声明的容器
5. 闭包：函数能够访问其词法作用域的能力，即使在作用域外执行

这些概念相互关联，共同构成了JavaScript的核心运行机制。
理解它们对于编写高质量的JavaScript代码至关重要。
*/