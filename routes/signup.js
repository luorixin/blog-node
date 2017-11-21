var fs = require('fs');
var path = require('path');
var sha1 = require('sha1');
var express = require('express');
var router = express.Router();

var UserModel = require('../models/users');
var checkNotLogin = require('../middlewares/check').checkNotLogin;
var checkLogin = require('../middlewares/check').checkLogin;

router.get('/',checkNotLogin,function(req,res,next){
	res.render('signup');
})
router.get('/edit',checkLogin,function(req,res,next){
	UserModel.getUserByName(req.session.user.name)
			.then(function(user){
				res.render('signup',{
  					user:user
  				})
			}).catch(next);
})
function checkUserBase(user){
	var errorMsg = "";
	try {
	  if (!(user.name.length >= 1 && user.name.length <= 10)) {
	    throw new Error('名字请限制在 1-10 个字符');
	  }
	  if (['m', 'f', 'x'].indexOf(user.gender) === -1) {
	    throw new Error('性别只能是 m、f 或 x');
	  }
	  if (!(user.bio.length >= 1 && user.bio.length <= 30)) {
	    throw new Error('个人简介请限制在 1-30 个字符');
	  }
	  if (!user.avatarName) {
	    throw new Error('缺少头像');
	  }
	  if (user.password.length < 6) {
	    throw new Error('密码至少 6 个字符');
	  }
	  if (user.password !== user.repassword) {
	    throw new Error('两次输入密码不一致');
	  }
	} catch (e) {
	  errorMsg = e.message;
	}
	return errorMsg;
}
router.post('/',checkNotLogin,function(req,res,next){
	var name = req.fields.name;
	var gender = req.fields.gender;
	var bio = req.fields.bio;
	var avatar = req.files.avatar.path.split(path.sep).pop();
	var avatarName = req.files.avatar.name;
	var password = req.fields.password;
	var repassword = req.fields.repassword;
	var user = {
		name : name,
		password:password,
		repassword:repassword,
		gender:gender,
		bio:bio,
		avatar:avatar,
		avatarName:avatarName
	}
	// 校验参数
	var errorMsg = checkUserBase(user);
	if(errorMsg!="") {
	// 注册失败，异步删除上传的头像
	  fs.unlink(req.files.avatar.path);
	  req.flash('error', errorMsg);
	  return res.redirect('/signup');
	}
	user.password = sha1(password);
	UserModel.create(user)
		.then(function(result){
			user = result.ops[0];
			delete user.password;
			req.session.user = user;
			req.flash('success','注册成功');
			res.redirect('/posts')
		})
		.catch(function(e){
			fs.unlink(req.files.avatar.path)
			// 用户名被占用则跳回注册页，而不是错误页
		    if (e.message.match('E11000 duplicate key')) {
		      req.flash('error', '用户名已被占用');
		      return res.redirect('/signup');
		    }
		    next(e);
		})
})
router.post("/edit",checkLogin,function(req,res,next){
	var name = req.fields.name;
	var gender = req.fields.gender;
	var bio = req.fields.bio;
	var avatar = req.files.avatar.path.split(path.sep).pop();
	var avatarName = req.files.avatar.name;
	var password = req.fields.password;
	var repassword = req.fields.repassword;
	var user = {
		name : name,
		password:password,
		repassword:repassword,
		gender:gender,
		bio:bio,
		avatar:avatar,
		avatarName:avatarName
	}
	// 校验参数

	var errorMsg = checkUserBase(user);
	if(errorMsg!="") {
	// 注册失败，异步删除上传的头像
	  fs.unlink(req.files.avatar.path);
	  req.flash('error', errorMsg);
	  return res.redirect('/signup/edit');
	}
	user.password = sha1(password);
	console.log(user._id)
	UserModel.updateUserById(req.session.user._id,user)
			.then(function(){
				req.flash('success', '编辑信息成功');
				delete user.password;
				user._id = req.session.user._id;
				req.session.user = user;
				res.redirect("/posts");
			}).catch(function(e){
				fs.unlink(req.files.avatar.path)
				// 用户名被占用则跳回注册页，而不是错误页
			    if (e.message.match('E11000 duplicate key')) {
			      req.flash('error', '用户名已被占用');
			      return res.redirect('/signup/edit');
			    }
			    next(e);
			});

})
module.exports = router;