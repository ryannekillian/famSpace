const router = require('express').Router();
const { User, Contact, Post, Comment } = require('../../models');
const userAuth = require('../../utils/auth'); // Authenticate user session middleware.


// GET /api/users (retrieve all users)
router.get('/', (req, res) => {
	// Access our User model and run .findAll() method)
	User.findAll({
		attributes: { exclude: ['user_password'] } // Preserve users' privacy.
	})
		.then((dbUserData) => res.json(dbUserData))
		.catch((err) => {
			console.log(err);
			res.status(500).json(err);
		});
});


// GET /api/users/1 (retrieve one user by id)
router.get('/:id', (req, res) => {
	User.findOne({
		attributes: { exclude: ['user_password'] },
		where: {
			id: req.params.id
		},
		include: [
			{
				model: Post,
				attributes: [
					'id',
					'caption',
					'imageURL',
					'fam_id',
					'created_at'
				],
			},
			{
				model: Comment,
				attributes: [
					'id',
					'comment_text',
					'created_at'],
				include: {
					model: Post,
					attributes: ['title']
				}
			}
		]
	})
		.then((dbUserData) => {
			if (!dbUserData) {
				res.status(404).json({ message: 'User not found.' });
				return;
			}
			res.json(dbUserData);
		})
		.catch((err) => {
			console.log(err);
			res.status(500).json(err);
		});
});



// POST /api/Users -- create a new user on signup
router.post('/', (req, res) => {
	User.create({
		first_name: req.body.first_name,
		last_name: req.body.last_name,
		birthdate: req.body.birthdate,
		email: req.body.email,
		username: req.body.username,
		user_password: req.body.user_password
	}).then((dbUserData) => {
		req.session.save(() => {
			req.session.user_id = dbUserData.id;
			req.session.username = dbUserData.username;
			req.session.loggedIn = true;

			res.json(dbUserData);
		});
		console.log(dbUserData)
		let telephone = "null";
		let address = "null";

		Contact.create({
			telephone:telephone,
			address:address,
			user_id:dbUserData.id
		})
	}).then(() => res.status(200))
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

// PUT /api/users/1
router.put('/:id', (req, res) => {
	User.update(req.body, {
		individualHooks: true,
		where: {
			id: req.params.id
		}
	})
		.then((dbUserData) => {
			if (!dbUserData[0]) {
				res.status(404).json({ message: 'No user found with this id' });
				return;
			}
			res.json(dbUserData);
		})
		.catch((err) => {
			console.log(err);
			res.status(500).json(err);
		});

});

/*
//PUT route to update user email
router.put('/', (req, res) => {
	Contact.update(req.body,{
	  where: {
		id: req.session.user_id
	  }
	})
	  .then(() => res.status(200))
	  .catch((err) => {
		console.log(err);
		res.status(500).json(err);
	  });
  });
*/

router.delete('/:id', (req, res) => {
	Comment.destroy({
		where: {
			user_id: req.params.id
		}
	}).then(() => {
		User.destroy({
			where: {
				id: req.params.id
			}
		})
			.then((dbUserData) => {
				if (!dbUserData) {
					res.status(404).json({ message: 'No user found with this id' });
					return;
				}
				res.json(dbUserData);
			})
			.catch((err) => {
				console.log(err);
				res.status(500).json(err);
			});
	});
});

// login
router.post('/login', (req, res) => {
	// find user based on email
	User.findOne({
		where: {
			email: req.body.email
		}
	}).then((dbUserData) => {
		if (!dbUserData) {
			res.status(400).json({ message: 'No user with that email address!' });
			return;
		}

		// validate password
		const validPassword = dbUserData.checkPassword(req.body.user_password);

		if (!validPassword) {
			res.status(400).json({ message: 'Incorrect password!' });
			return;
		}

		// initiate creation of session and grab values for session variables from db
		req.session.save(() => {
			// declare session variables
			req.session.user_id = dbUserData.id;
			req.session.username = dbUserData.username;
			req.session.loggedIn = true;

			res.json({ user: dbUserData, message: 'You are now logged in!' });
		});
	});
});

// logout -- if user is loggedIn, destroy session variables and reset cookie to clear session, then send res back to client so it can redirect user to homepage
router.post('/logout', (req, res) => {
	if (req.session.loggedIn) {
		req.session.destroy(() => {
			res.status(204).end();
		});
	} else {
		res.status(404).end();
	}
});



module.exports = router;