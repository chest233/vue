// 深入理解 JavaScript 函数参数对作用域的影响

console.log('=== 测试1：带默认参数的函数 ===');
var test1 = function() {
  var outer = 'outer';
  
  var func = function(a = 1, b = 2) {
    var inner = 'inner';
    
    // 参数默认值可以引用外部变量
    var funcWithOuterRef = function(c = outer) {
      var nested = 'nested';
      
      return function() {
        console.log(a, b, c, inner, nested);
      };
    };
    
    return funcWithOuterRef();
  };
  
  var result = func();
  console.log('查看 result 的 [[Scopes]]:', result);
  debugger;
};

console.log('\n=== 测试2：不带参数的函数 ===');
var test2 = function() {
  var outer = 'outer';
  
  var func = function() { // 没有参数
    var inner = 'inner';
    
    var funcNested = function() {
      var nested = 'nested';
      
      return function() {
        console.log(inner, nested, outer);
      };
    };
    
    return funcNested();
  };
  
  var result = func();
  console.log('查看 result 的 [[Scopes]]:', result);
  debugger;
};

console.log('\n=== 测试3：参数默认值引用其他参数 ===');
var test3 = function() {
  // 这种情况下，参数作用域更加重要
  var func = function(a = 1, b = a * 2) {
    var inner = 'inner';
    
    return function() {
      console.log(a, b, inner);
    };
  };
  
  var result = func();
  console.log('查看 result 的 [[Scopes]]:', result);
  debugger;
};

console.log('\n=== 测试4：解构参数 ===');
var test4 = function() {
  // 解构参数也会创建参数作用域
  var func = function({x = 1, y = 2} = {}) {
    var inner = 'inner';
    
    return function() {
      console.log(x, y, inner);
    };
  };
  
  var result = func();
  console.log('查看 result 的 [[Scopes]]:', result);
  debugger;
};

console.log('\n=== 测试5：普通参数（无默认值）===');
var test5 = function() {
  // 即使没有默认值，有参数也会创建参数作用域
  var func = function(a, b) {
    var inner = 'inner';
    
    return function() {
      console.log(a, b, inner);
    };
  };
  
  var result = func(10, 20);
  console.log('查看 result 的 [[Scopes]]:', result);
  debugger;
};

// 执行所有测试
console.log('在浏览器控制台中运行这些测试，并在 debugger 处查看 [[Scopes]]');
console.log('你会发现：');
console.log('1. 有参数的函数会显示 Block 作用域');
console.log('2. 无参数的函数直接显示 Closure 作用域');
console.log('3. 这是 V8 引擎的实现细节，不影响代码功能');

// 运行测试
test1();
test2();
test3();
test4();
test5();