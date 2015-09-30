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
			date: null,
			content: null,
			likes: 0,
			share: 0
		},
		validate: function(attrs) {
			if (attrs.content.length === 0) {
				return "Dados inválidos!";
			}
		},
		toTemplate: function() {

			var j = this.toJSON();
			j.timeSincePost = this.timeSincePost();
			return j;
			
		},
		timeSincePost: function() {

			var measure = [[1000, 'segundo', 'segundos'], [60, 'minuto', 'minutos'], [60, 'hora', 'horas'], [24, 'dia', 'dias'], [7, 'semana', 'semanas'], [4, 'mês', 'meses'], [12, 'ano', 'anos']];
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

			return (i === 0 ? "agora mesmo" : parseInt(passedTime) + " " + (parseInt(passedTime) === 1 ? measure[i-1][1] : measure[i-1][2]) + " atrás");
		
		},
		like: function() {
			this.set({ likes: this.get('likes') + 1 });
		},
		share: function() {
			this.set({ share: this.get('share') + 1 });
		}
	});

	//Post Collection
	var PostCollection = Backbone.Firebase.Collection.extend({
		model: PostModel,
		url: 'https://backbone-posts.firebaseio.com/posts',
		initialize: function() {
			this.fetch();
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
		remove: function() {
			this.$el.slideUp('normal', function() {
				this.remove();
			});
		},
		deletePost: function() {
			this.model.destroy();
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
			"input #postContent" : "enablePostButton",
			"keyup" : "insertPost",
			"submit" : "insertPost"
		},
		initialize: function() {
			this.render();
			this.inputContent = this.$el.find("#postContent");
			this.submitButton = this.$el.find("input[type='submit']");
		},
		render: function() {
			var html = Mustache.to_html(this.template, this.model.toJSON());
			this.$el.html(html);
		},
		reset: function() {
			this.$el.find('textarea').val('');
			this.enablePostButton();
		},
		enablePostButton: function() {
			// habilita o envio apenas se o post conter dados
			if (this.inputContent.val().length > 0) {
				this.submitButton.prop('disabled', false);
			} else {
				this.submitButton.prop('disabled', true);
			}
		},
		insertPost: function(e) {

			//verifica se a tecla ENTER foi pressionada
			if ((e.type === 'keyup') && (e.which !== 13))  {
				return false;
			}

			e.preventDefault();

			// seta as informações do post no Model
			this.model.set('date', new Date().toISOString());
			this.model.set('content', this.inputContent.val().replace(/\n/g, ''));

			//verifica os dados e grava se for válido, depois reseta o form
			if (this.model.isValid()) {
				this.collection.create(this.model.clone().attributes);
				this.reset();
			}
		}
	});

	//App Main View
	var AppView = Backbone.View.extend({
		el: '.container',
		initialize: function() {

			_.bindAll(this, 'showPost', 'showAllPosts');

			// armazena em variáveis os elementos containers dé formulário e posts
			this.elFormInsert = this.$el.find('#form-insert-post');
			this.elPosts = this.$el.find('#container-posts');

			// instância a collection da view
			this.collection = new PostCollection();
			this.collection.on({
				"add": this.showPost
			}, this);

			// cria uma nova instância do formulário de inserir post
			var postInsert = new PostInsertView({ 
				model: new PostModel(),
				collection: this.collection,
				el: this.elFormInsert
			});
		},
		showPost: function(post) {

			// Cria uma nova instância da view Post usando o model passado por parâmetro
			var postView = new PostView({
				model: post
			});
			postView.model.on({
				"destroy" : postView.remove,
				"change:likes change:share": postView.render
			}, postView);

			// insere no documento o post
			this.elPosts.prepend(postView.render().el).promise().done(function() {
				postView.$el.slideDown('normal');
			});

			// atualiza os dados do post a cada 1 minuto
			setInterval(_.bind(postView.render, postView), 1 * 60000);

		},
		showAllPosts: function() {

			this.elPosts.html('');
			this.collection.each(this.showPost);

		}
	});

	var appView = new AppView();

});