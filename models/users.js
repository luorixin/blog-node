var User = require('../lib/mongo').User;

module.exports = {
	create: function(user){
		return User.create(user).exec();
	},
	getUserByName : function(name){
		return User.findOne({name:name})
					.addCreatedAt()
					.exec();
	},
	updateUserById: function(userId,data){
		return User.update({_id:userId},{$set:data}).exec();
	}
}