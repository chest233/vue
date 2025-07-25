# JavaScript 函数参数对作用域链的影响

## 问题描述

当函数有参数（包括默认参数）时，内部函数的 `[[Scopes]]` 会显示 BLOCK 作用域；而当函数没有参数时，会显示 Closure 作用域。

## 原因分析

### 1. 函数参数与块级作用域

在 ES6 中，当函数有参数（特别是有默认参数）时，JavaScript 引擎会创建一个额外的作用域层：

```javascript
function (a = 0, b = 1) {
  // 这里实际上有两个作用域：
  // 1. 参数作用域（包含 a 和 b）
  // 2. 函数体作用域
}
```

### 2. 作用域链的差异

**带参数的情况：**
```
s2_f1 的 [[Scopes]]:
├── [0] Block (参数作用域)
│   ├── a: 0
│   └── b: 1
├── [1] Closure (s1_f1)
│   └── s2_v1: "s2_v1"
└── [2] Global
```

**不带参数的情况：**
```
s2_f1 的 [[Scopes]]:
├── [0] Closure (s1_f1)
│   └── s2_v1: "s2_v1"
└── [1] Global
```

### 3. 为什么会有这种差异？

1. **参数默认值的特殊处理**：ES6 规范要求函数参数的默认值在一个单独的作用域中求值，这个作用域介于外部作用域和函数体作用域之间。

2. **块级作用域的创建**：当函数有参数时，V8（Chrome 的 JavaScript 引擎）会创建一个 BLOCK 作用域来存储参数。这是为了正确处理参数默认值和解构等 ES6 特性。

3. **优化考虑**：当函数没有参数时，不需要额外的参数作用域，所以直接显示为 Closure。

### 4. 实际影响

这种差异通常不会影响代码的执行结果，因为：
- 变量查找顺序保持一致
- 闭包功能正常工作
- 只是内部实现细节的不同

### 5. 验证代码

```javascript
// 更复杂的例子
function testScopes() {
  // 带参数默认值
  function withParams(x = 10) {
    let innerVar = 'inner';
    return function() {
      console.log(x, innerVar);
    };
  }
  
  // 不带参数
  function withoutParams() {
    let innerVar = 'inner';
    return function() {
      console.log(innerVar);
    };
  }
  
  const f1 = withParams();
  const f2 = withoutParams();
  
  // 在控制台查看 f1 和 f2 的 [[Scopes]]
  console.log({f1, f2});
}
```

## 总结

这是 JavaScript 引擎（特别是 V8）的内部实现细节。当函数有参数时，会创建一个额外的 BLOCK 作用域来处理参数，这导致了 `[[Scopes]]` 显示的差异。这种差异不影响代码的实际行为，只是反映了引擎内部的作用域管理方式。