// 测试1：带参数的函数
console.log('=== 测试1：带参数的函数 ===');
var s0_f1_with_params = function () {
  var s1_f1 = function (a = 0, b = 1) {
    var s2_v1 = 's2_v1';
    
    var s2_f1 = function () {
      console.log(s2_v1);
    }
    
    console.log('带参数版本的 s2_f1:', s2_f1);
    debugger; // 在浏览器中可以查看 [[Scopes]]
  }
  s1_f1();
}

// 测试2：不带参数的函数
console.log('\n=== 测试2：不带参数的函数 ===');
var s0_f1_without_params = function () {
  var s1_f1 = function () { // 注意：这里没有参数
    var s2_v1 = 's2_v1';
    
    var s2_f1 = function () {
      console.log(s2_v1);
    }
    
    console.log('不带参数版本的 s2_f1:', s2_f1);
    debugger; // 在浏览器中可以查看 [[Scopes]]
  }
  s1_f1();
}

// 执行测试
s0_f1_with_params();
s0_f1_without_params();