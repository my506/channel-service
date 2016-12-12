/**
 * ProposalController
 *
 * @description :: 投保服务
 * @help        :: See http://sinosafe.com.cn/#!/documentation/concepts/ProposalController
 */
var thisService = 'proposal';
var thisName = 'ProposalController';
// var X2JS = require('x2js');
// var x2j = new X2JS();
// var js = x2js.xml2js(s);
// var xml=x2js.js2xml(js);

module.exports = {
	//渠道投保服务
	channel: function(req,res){
		var channelId = req.param('id');
		var message = req.body || {"firstName":"xumy","lastName":"mingyong","age":"16","a":"4", "b":[{"c":"1","d":"A"},{"e":"12"}]};

		sails.log.info(thisName+'->channel('+channelId+') message:'+JSON.stringify(message));

		if(!message){
			var err = new Error('req.body is  undefined (expected object),请求没有post json 对象');		
			sails.log.info(message+typeof(message));
			return  res.json({err:err.message});	
		}		

		ChannelService.req(thisService,channelId,message,function(err,rst){
			sails.log.info(thisName+'->channel'+err);
			var errorMessage = err?err.message:null;
			var rstObj = {err:errorMessage,res:rst};
			//json响应转xml
			// if (ct === 'application/xml' || ct === 'text/xml') {
			// 	rstObj = x2j.js2xml(rstObj);
			// }			 

			res.json(rstObj);	
		});	
	}
}
