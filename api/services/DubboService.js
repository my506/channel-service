var ZD = require('zoodubbo');
var zd = null;
module.exports = {
	//连接服务
	init :function(conf){
		var config ={};	
	    config.dubbo = conf.version||'2.8.3';    
	    config.conn = conf.url||'dubbotest.sinosafe.com.cn:2181';
	    zd = new ZD(config);
	    zd.connect();
	},
	//服务调用
	invoker :function (service,method,args,cb){
	    return this.zd.getInvoker(service).excute(method, [args], function (err, data) {cb(err,data)});
	},
	//连接关闭
	close :function (){
	    dubbo.zd.close();
	}
}
