console.log('1.js - 获取script标签数量:', document.getElementsByTagName('script').length);
console.log('1.js - 所有script标签:', document.getElementsByTagName('script'));

// 测试DOM解析状态
console.log('1.js - document.readyState:', document.readyState);

// 检查后续的script标签是否存在
setTimeout(() => {
    console.log('1.js setTimeout - 获取script标签数量:', document.getElementsByTagName('script').length);
    console.log('1.js setTimeout - 所有script标签:', document.getElementsByTagName('script'));
}, 0);