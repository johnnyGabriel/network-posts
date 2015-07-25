/* global Mustache, Backbone, _ */

$(function() {
	
	//Post Model
	var PostModel = Backbone.Model.extend({
		defaults: {
			user: {
				id: 1,
				username: "Visitante",
				avatar: "assets/images/avatar.png"
			},
			date: "",
			content: "",
			likes: "",
			share: ""
		},
		toTemplate: function() {

			var j = this.toJSON();
			j.timeSincePost = this.timeSincePost();
			return j;
			
		},
		timeSincePost: function() {

			var measure = [[1000, 'segundo'], [60, 'minuto'], [60, 'hora'], [24, 'dia'], [7, 'semana'], [4, 'mese'], [12, 'ano']];
			var passedTime = Date.now() - Date.parse(this.get('date'));
			var temp = passedTime;
			var i = 0;

			while (i < measure.length) {

				if ((temp /= measure[i][0]) > 1) {
					passedTime = temp;
				} else {
					break;
				}

				i++;
			}

			return (i === 0 ? "agora mesmo" : parseInt(passedTime) + " " + (parseInt(passedTime) === 1 ? measure[i-1][1] : measure[i-1][1] + "s") + " atrás");
		
		},
		like: function() {
			this.set({ likes: this.get('likes') + 1 });
		},
		share: function() {
			this.set({ share: this.get('share') + 1 });
		}
	});

	//Post Collection
	var PostCollection = Backbone.Collection.extend({
		model: PostModel,
		initialize: function() {
			this.readLocal();
		},	
		saveLocal: function() {
			localStorage.setItem('posts', JSON.stringify(this.models));
		},
		readLocal: function() {
			var postsLocal = localStorage.getItem('posts');
			if (postsLocal) {
				this.add(JSON.parse(postsLocal));
			} else {
				this.add({
					user: {
						id: 0,
						username: "Johnny Pestana",
						avatar: "assets/images/johnny-avatar.jpg"
					},
					date: "2015-07-22T19:34:22.720Z",
					content: "Olá, seja bem-vindo!",
					likes: 10,
					share: 2
				});
			}
		}
	});

	//Post View
	var PostView = Backbone.View.extend({
		tagName: "div",
		className: "post-container",
		template: $('#post-view-template').html(),
		events: {
			"click .post-delete" : "deletePost",
			"click .post-like" : "likePost",
			"click .post-share" : "sharePost"
		},
		render: function() {
			var html = Mustache.to_html(this.template, this.model.toTemplate());
			this.$el.html(html);
			return this;
		},
		removePost: function() {
			this.$el.slideUp('normal', function() {
				this.remove();
			});
		},
		deletePost: function() {
			this.model.unset('user');
		},
		likePost: function() {
			this.model.like();
		},
		sharePost: function() {
			this.model.share();
		}
	});

	//Post Insert View
	var PostInsertView = Backbone.View.extend({
		template: $('#insert-post-template').html(),
		events: {
			"keyup #postContent" : "enablePostButton",
			"submit" : "insertPost"
		},
		initialize: function(model) {
			this.render();
		},
		render: function() {

			var html = Mustache.to_html(this.template, this.model.toJSON());
			this.$el.html(html);
			this.inputContent = this.$el.find("#postContent");
			this.submitButton = this.$el.find("input[type='submit']");
			return this;

		},
		enablePostButton: function() {

			// habilita / desabilita o envio do formulário de novo post
			if (this.inputContent.val().length > 0) {
				this.submitButton.prop('disabled', false);
			} else {
				this.submitButton.prop('disabled', true);
			}

		},
		insertPost: function(e) {

			e.preventDefault();

			// seta as informações do post no Model
			this.model.set({
				date: new Date(),
				content: this.inputContent.val(),
				likes: 0,
				share: 0
			});

			// reseta o formulário de inserção de post
			this.render();
		}
	});

	//App Main View
	var AppView = Backbone.View.extend({
		el: '.container',
		initialize: function() {

			_.bindAll(this, 'showPost', 'showAllPosts');

			this.elFormInsert = this.$el.find('#form-insert-post');
			this.elPosts = this.$el.find('#container-posts');

			// Model do formulário de inserção de novo post
			this.newPostModel = new PostModel();

			this.newPostModel.on('change', function(model) {
				this.postCollection.add(model.clone());
			}, this);

			// View do formulário de inserção de novo post
			var postInsert = new PostInsertView({ model: this.newPostModel });

			// insere no documento o formulário de inserção de novo post
			this.elFormInsert.append(postInsert.render().el);

			// Collection de posts
			this.postCollection = new PostCollection();

			this.postCollection.on('update', function() {
				this.postCollection.saveLocal();
			}, this);

			this.postCollection.on('add', function(model) {
				this.showPost(model);
			}, this);
			
			// insere no documento todos os posts
			this.showAllPosts();

		},
		showPost: function(post) {

			// View do post
			var postView = new PostView({
				model: post
			});

			post.on('change:user', function(model) {
				postView.removePost();
				this.postCollection.remove(model);
			}, this);

			post.on('change:likes', function() {
				postView.render();
				this.postCollection.saveLocal();
			}, this);

			post.on('change:share', function() {
				postView.render();
				this.postCollection.saveLocal();
			}, this);

			// insere no documento o post
			this.elPosts.prepend(postView.render().el);

			// executa a animação de entrada do post
			postView.$el.slideDown('normal');

			// atualiza os dados do post a cada 1 minuto
			setInterval(function() {
				postView.render();
			}, 1 * 60000);

		},
		showAllPosts: function() {

			this.elPosts.html('');
			this.postCollection.each(this.showPost);

		}
	});

	var appView = new AppView();

});