var moment = require('moment');
var thisName = 'UtilsService';
var idCard = require('idcard');
module.exports = {
	idCard:idCard,
	moment:moment,
	async:async,
	_:_
};

// //身份证合法时返回的数据结构 
// { 
//     valid: true,//身份证是否合法的标志 
//     gender: 'M',//M->男，F->女 
//     birthday: 19910210,// 
//     province: {
//         code: '440000',//行政区域编码 
//         text: '广东省' 
//     },
//     city: { 
//         code: '440800', 
//         text: '湛江市' 
//     },
//     area: { 
//         code: '440882', 
//         text: '雷州市' 
//     },
//     cardType: 1,//身份证类型，1->大陆，2->港澳台 
//     cardText: '大陆',
//     address: '广东省湛江市雷州市',
//     age:24,
//     constellation:'水瓶'//星座  
// }
// //身份证非法时返回的数据结构 
// {
//     valid: false
// }
//
