/**
 * ChannelService
 *
 * @description :: 渠道服务，由控制器使用
 * @help        :: See http://sinosafe.com.cn/#!/documentation/concepts/ChannelService
 */
 var thisName = 'ChannelService';
 var Joi = require('joi');
 var tv4 = require('tv4');

module.exports = {

	/*
	 * validater
	 *
	 * @obj :: 待校验对象，来源渠道原始报文
	 * @schema:: 校验规则，来源数据库配置
	 * @callback:: 回调方法(err, value)如果正确,返回校验;
	 */
	req: function(service,channel,message,next){

		sails.log.info(JSON.stringify(UtilsService.idCard.info('130503670401001')));
		sails.log.info(thisName+'-> req ('+channel+','+service+')');		
		async.waterfall([
			//a-log:记录请求
		    function(cb){
		    	sails.log.info(thisName+'-> req ('+channel+','+service+'):'+'a-log:记录请求');		
		    	var temp = {
		    		channel:channel,
		    		service:service,
		    		steps:{
		    			'a-log':{
			    			req:message,
			    			rule:null,
			    			res:null,
			    			err:null
		    			},
		    			'b-find':{},
		    			'c-validate':{},
		    		}
		    	};
				Audit.create(temp).exec(
					function (err, audit) {
						//audit.steps['a-log'].err = err;
						cb(err,service,channel,message,audit);
					}
				);
    		 },
    		//b-find:查找渠道配置
		     function(service,channel,message,audit,cb){
		     	sails.log.info(thisName+'-> req ('+channel+','+service+'):'+'b-find:查找渠道配置');		
				Channel.find({channel:channel}).exec(function (err, configs) {
					if(err){
						return cb(err,service,channel,message,audit,null);
					}
					if(configs.length!=1){
						var err =  new Error('channel must be only one record,没有配置或配置了多个渠道,channel id:'+channel);	
						return cb(err,service,channel,message,audit,null);	
					}
					var conf = _.cloneDeep(configs[0]);
					return cb(err,service,channel,message,audit,conf);
				}); 
    		},
    		//c-validate:渠道报文校验
		     function(service,channel,message,audit,conf,cb){
		     	sails.log.info(thisName+'-> req ('+channel+','+service+'):'+'c-validate:渠道报文校验');		
		     	if(conf.validate){
		     		sails.log.info(thisName+'-> req ('+channel+','+service+'):'+'c-validate:1'+JSON.stringify(conf));		
		     		var isValid = tv4.validate(message, conf.validate);
		     			if(!isValid){				     				
							audit.steps['c-validate'].err = tv4.error;;
			     			cb(tv4.error,service,channel,message,audit,conf);
			     		}else{
			     			cb(null,service,channel,message,audit,conf);
			     		}
		     	}else{
		     		sails.log.warn(thisName+'-> req ('+channel+','+service+'):'+'没有配置请求校验规则！');
		     		cb(null,service,channel,message,audit,conf);		     		
		     	}
    		}, 
    		//d-convert:报文字段转换
		     function(service,channel,message,audit,conf,cb){
		     	sails.log.info(thisName+'-> req ('+channel+','+service+'):'+'d-convert:报文字段转换');		
		     	var rules = conf.convert;
		     	if(rules){
		     	  	if( rules instanceof Array){
						async.forEach(
							rules,
							function(item, callback) {
								var keyName = item.keyName;
								var mapValue = item.mapValue;
								//通过feild 值取得实际option 值
								var optionKey = _.get(message, keyName);					
								//通过option 值取得映射option 值
								var optionValue = mapValue[optionKey];
								//修改对象optionValue
								_.set(message, keyName, optionValue);
							  	callback();
							},
							function(err) {
								//audit.steps['d-covert'].err = err;
								cb(err,service,channel,message,audit,conf);
							}
						);
					}else{
						var err =  new Error('convert function want Array, convert[],比如：[{"keyName" : "a[0].b.c","mapValue" : {"3" : "男",   "4" : "女" }}');   
						cb(err,service,channel,message,audit,conf);
					}
				}else{
					sails.log.warn(thisName+'-> req ('+channel+','+service+'):'+'d-convert:没有配置请求报文字段内容转换！');		
					cb(null,service,channel,message,audit,conf);
		     	}
    		},  
    		//e-format:报文字段格式转换--完后渠道相关处理结束，开始产品相关处理
		     function(service,channel,message,audit,conf,cb){
		     	sails.log.info(thisName+'-> req ('+channel+','+service+'):'+'e-format:报文字段格式转换'+JSON.stringify(message));	

		     	var prod = null;
		     	var plan = null;
		     	var error = null;

		     	if(conf.format){
		     		try{
			     		var util ={};
			     		var format = new Function("message","util",conf.format); 
			     		var message1 = format(message,util);
			     		prod = message1.prod;
			     		plan = message1.plan;

			     	}catch(err){
						sails.log.error(thisName+' .req-> format: '+err.stack);
						error = err;			     		
					}
		     	}else{
		     		error =  new Error('conf.format function no set,we need the prod and plan,format步骤没有配置');   	     		
		     	}
		     	cb(error,service,channel,message,audit,conf,prod,plan);	
    		} ,
    		//f-prodTemplate:产品模板<方案模板|计算模板<渠道模板
		     function(service,channel,message,audit,conf,prod,plan,cb){
		     	sails.log.info(thisName+'-> req ('+channel+','+service+'):'+'f-prodTemplate:产品及方案模板');	
		     	if(prod ){
		     		ProductService.req(service,channel,message,audit,conf,prod,plan, function(err,template){
						cb(err,service,channel,message,audit,conf,prod,plan,template);		     	
		     		});
		     	}else{
		     		var err =  new Error('format function execute error, no set the prod ,format步骤没有配置产品编码');   
		     		sails.log.error(thisName+'-> req ('+channel+','+service+'):'+'format步骤没有配置产品编码');  		
		     		cb(err,service,channel,message,audit,conf,prod,plan,null);			     		
		     	}
    		} ,
    		//h-mapping:渠道覆盖方案模板
		     function(service,channel,message,audit,conf,prod,plan,template,cb){
		     	sails.log.info(thisName+'-> req ('+channel+','+service+'):'+'h-mapping:渠道方案模板'+JSON.stringify(template));	
		     	if(conf && conf.mapping && conf.mapping.prod){
					async.forEach(
						conf.mapping.prod,
						function(item, callback) {
							_.set(template, item[1], _.get(message, item[0]));	callback();	
						},
						function(err){
							cb(err,service,channel,message,audit,conf,prod,plan,template);
						}
					);    
		     	}else{
		     		var err =  new Error('mapping function not set no set,没有配置mapping方法'+channel+','+service+','+prod);
		     		sails.log.error(thisName+'-> req ('+channel+','+service+'):'+'h-mapping:未没有配置mapping方法');  	
		     		cb(err,service,channel,message,audit,conf,prod,plan,template);		     		
		     	}
    		} , 		
    		//i-transfer:渠道方法，用作最好修正数据
 			function(service,channel,message,audit,conf,prod,plan,template,cb){
 				sails.log.info(thisName+'-> req ('+channel+','+service+'):'+'i-transfer:渠道覆盖方案模板'+JSON.stringify(template));	
		     	if(conf.transfer){
		     		try{
			     		var util ={};
			     		var transfer = new Function("message","util",conf.transfer); 
			     		template = transfer(template,util);
			     		cb(err,service,channel,message,audit,conf,prod,plan,template);
			     	}catch(err){
						audit.steps['j-transfer'].err = err;
						sails.log.error(thisName+'-> req ('+channel+','+service+'):'+err);  	
						cb(service,channel,message,audit,conf,prod,plan,template);			     		
					}
		     	}else{
		     		cb(null,service,channel,message,audit,conf,prod,plan,template);		     		
		     	}
    		} 		  
    	], 
    	//打完收工
    	function (err,service,channel,message,audit,conf,prod,plan,template) {
    		sails.log.info(thisName+'-> req ('+channel+','+service+'):'+'done:'+JSON.stringify(template));	  
			next(err,template);	    
		});
    }
};