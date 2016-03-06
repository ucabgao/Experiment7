Meteor.publish('projects', function() {
	return Projects.find({archived: { $nin: [1] }});
});

Meteor.publish('tags', function() {
	return Meteor.tags.find();
});

Meteor.publish('offers', function() {
	return Offers.find({});
});

var validateTags = function(tags) {
	var re = /^[a-z0-9\-\+]+$/i;
	return _.map(tags, function(tag) {
		var t = tag.trim();
		if(!re.test(t)) {
			throw new Meteor.Error(403, "Invalid tag: tags must be alphanumeric");
		}
		if(t.length > 25) {
			throw new Meteor.Error(403, "Invalid tag: tags must no more than 25 characters long");
		}
		return t;
	});
};

Meteor.methods({
	addProject: function(project) {
		if(!this.userId)
			throw new Meteor.Error(403, "Please register and log in to post a new project.");
		check(project.name, String);
		check(project.role, String);
		check(project.description, String);

		// validate tags
		project.tags = validateTags(project.tags);

		var newId = Projects.insert({
			name: project.name,
			postedDate: new Date(),
			role: project.role,
			description: project.description,
			status: "ready",
			owner: this.userId
		});
		if(project.tags.length > 0) {
			_.forEach(project.tags, function(tag) {
				Projects.addTag(tag, {_id: newId});
			});
		}
		return newId;
	},
	updateProjectStatus: function(attr) {
		if(!this.userId)
			throw new Meteor.Error(403, "Please sign in to edit a project.");
		var prj = Projects.findOne(attr.id);
		if(!roles.isAdmin() && this.userId !== prj.owner)
			throw new Meteor.Error(403, "You are not the owner of this project.");
		Projects.update(attr.id, {$set: {status: attr.status}});
	},
	updateProject: function(project) {
		if(!this.userId)
			throw new Meteor.Error(403, "Please sign in to edit a project.");
		var prj = Projects.findOne(project._id);
		if(!roles.isAdmin() && this.userId !== prj.owner)
			throw new Meteor.Error(403, "You are not the owner of this project.");
		if(project.name) {
			Projects.update(project._id, {$set: {name: project.name}});
		}
		if(project.role) {
			Projects.update(project._id, {$set: {role: project.role}});
		}
		if(project.description) {
			Projects.update(project._id, {$set: {description: project.description}});
		}
	},
	deleteProject: function(id) {
		if(!this.userId)
			throw new Meteor.Error(403, "Please sign in to remove a project.");
		var project = Projects.findOne(id);
		if(!roles.isAdmin() && this.userId !== project.owner)
			throw new Meteor.Error(403, "You are not the owner of this project.");
		Projects.update({_id: id}, {$set: {archived: 1}});
		return true;
	},
	addView: function(id) {
		Projects.update({_id: id}, {$inc: {views: 1}});
	},
	sendOfferOfHelp: function(options) {
		var p = options.properties;
		var u = Meteor.users.findOne({ _id: p.offeringUser });
		Offers.insert({
			userId: p.offeringUser,
			userName: p.offeringUserName,
			userEmail: roles.getEmail(u),
			projectId: p.projectId,
			madeOn: new Date(),
			message: p.message,
			accepted: false
		})
		var notification = createNotification(options);
	}
});
