var path = require("path");
var express = require("express");
var session = require("express-session");
var MongoStore = require("connect-mongo")(session);
var flash = require("connect-flash");
var config = require('config-lite')({
    config_basedir: __dirname,
    config_dir: 'config',
});
var routes = require('./routes')
var pkg = require("./package");
var winston = require("winston");
var expressWinston = require("express-winston");
var expressFormidable = require("express-formidable");

var app = express();

//设置目录
app.set('views',path.join(__dirname,'views'));
//设置引擎
app.set('view engine','ejs');

//设置文件某
app.use(express.static(path.join(__dirname,'public')));
//session 中间件
// console.log(JSON.stringify(config));
app.use(session({
	name:config.session.key,
	secret:config.session.secret,
	resave: false, //添加 resave 选项  
  	saveUninitialized: true, //添加 saveUninitialized 选项 
	cookie:{
		maxAge:config.session.maxAge
	},
	store:new MongoStore({
		url:config.mongodb
	})
}))
//flash中间件，显示通知
app.use(flash());
//处理表单上传的中间件
app.use(expressFormidable({
	uploadDir:path.join(__dirname,'public/img'),
	keepExtensions:true
}))

//设置模板全局变量
app.locals.blog={
	title:pkg.name,
	description:pkg.description
}

//添加模板必须的三个变量
app.use(function(req,res,next){
	res.locals.user = req.session.user;
	res.locals.success = req.flash('success').toString();
	res.locals.error = req.flash('error').toString();
	next();
})

//正常请求日志
app.use(expressWinston.logger({
	transports:[
		new winston.transports.Console({
			json:true,
			colorize:true
		}),
		new winston.transports.File({
			filename:'logs/success.log'
		})
	]
}))

//错误请求日志
app.use(expressWinston.errorLogger({
	transports:[
		new winston.transports.Console({
			json:true,
			colorize:true
		}),
		new winston.transports.File({
			filename:'logs/error.log'
		})
	]
}))

//路由
routes(app);

//error page
app.use(function(err,req,res,next){
	res.render('error',{
		error:err
	})
})

if (module.parent) {
	moudle.exports = app;
}else{
	//监听端口，启动
	app.listen(config.port,function(){
		console.log(`${pkg.name} listening on port ${config.port}`);
	})
}
