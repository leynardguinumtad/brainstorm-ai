### Backend of Brainstorm AI

### Brainstorm1

### Brainstorm2

### Database

### Session

We use the `express-session` middleware package to work on session data.

1. the req.session.id is a unique identifier of the session itself. It is independent of the user
2. We store the current user id in req.session.user_id
3. We store the current admin user id in req.session.admin_user_id
