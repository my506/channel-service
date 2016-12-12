/**
 * ProductService
 *
 * @description :: 产品服务，由控制器使用
 * @help        :: See http://sinosafe.com.cn/#!/documentation/concepts/ProductService
 */

var moment = require('moment');
var thisName = 'ProductService';
module.exports = {

	/*
	 * req 产品模板<方案模板|计算模板<渠道模板
	 *
	 * @product :: 产品编码
	 * @plan:: 方案编码
	 * @channel:: 渠道编码	 
	 * @channel:: 渠道报文	 
	 * @next:: 回调方法(err, value);
	 */
	 //service,channel,message,audit,conf,prod,plan
	req: function(service,channel,message,audit,conf,product,plan, next){
		sails.log.info(thisName+'-> req ('+product+','+plan+'):'+'通过产品编码和方案编码找产品');	
		async.waterfall([	
			 //产品模板<方案模板|计算模板<渠道模板
		     function(cb){				
				Product.find({product:product}).exec(function (err, prods) {	

					if(err){
						return cb(err, service,channel,message,audit,conf,product,plan, null);		   
					}

					if(prods.length != 1){
						var err =  new Error('prod must be only one record,没有配置或配置了多个产品,product:'+product);
						return cb(err, service,channel,message,audit,conf,product,plan, null);		     
					}

					var prod = _.cloneDeep(prods[0]);
					if(!prod || !prod.template){
						var err =  new Error('prod.template must be SET,没有配置产品方案,product:'+product);
						return cb(err, service,channel,message,audit,conf,product,plan, null);		     
					}
					var prodTemplate = prod.template; //险种、险别的保额、保费都是0;
					var rstTemplate = {}; //结果模板
					//产品模板<方案模板
					if(plan && prod[plan] && prod[plan].template){						
						var planTemplate = prod[plan].template; //方案填充应有的险种、险别的保额、保费具体数据;
						var rstTemplate = _.defaultsDeep(planTemplate, prodTemplate);
						//产品渠道方案：方案模板<渠道模板
						if(channel && prod[channel] && prod[channel].template){
							var chnlTemplate = prod[channel].template; //产品渠道方案模板，一般不会用到;
							rstTemplate = _.defaultsDeep(chnlTemplate, rstTemplate);
						}
						//return cb(err, service,channel,message,audit,conf,product,plan, rstTemplate);

					}//else 
					if(prod && prod.calculate){//计算摸吧
						sails.log.info(thisName+'-> req ('+channel+','+service+'):'+'calculate:'+prod.calculate);
						try{
				     		var calculate = new Function("message","util",prod.calculate); 
				     		var caclTemplate = calculate(message,{moment:moment,_:_,async:async});	
				     		sails.log.info(thisName+'-> req ('+channel+','+service+'):'+'calculate:'+JSON.stringify(caclTemplate));						
				     		rstTemplate = _.defaultsDeep(caclTemplate, prodTemplate);	 
							return cb(err, service,channel,message,audit,conf,product,plan,rstTemplate);
						}catch(err){
							sails.log.error(thisName+' -> caculate : '+err.stack);
							return cb(err, service,channel,message,audit,conf,product,plan,null);		     		
						}

					}else{
						var err = new Error('prod.plan.template or prod.caculate must set be plan ,没有配置产品：'+product+' 对应的方案模板或计算模板：'+plan);
						return cb(err, service,channel,message,audit,conf,product,plan, null);
					}
				}); 
			}
    	], function (err,service,channel,message,audit,conf,prod,plan,template) {
    		sails.log.info(thisName+'-> req ('+channel+','+service+'):'+'done:'+JSON.stringify(template));		  
			next(err,service,channel,message,audit,conf,prod,plan,template);	    
		});
    }
};