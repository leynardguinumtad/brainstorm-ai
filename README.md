# Brainstorm AI

This is an end term requirement for system integration and architecture (SIA). The project is built using Node.js's express web framework. Ejs is used as the templating engine. For the database, MySQL was used.

### Setup

1. Fork the repository.
2. In the terminal, run `npm install` to install dependencies.
3. In the terminal, run `npm start` to start the server. The web app is accessible through port `3000`, e.g., `localhost:3000/`.
4. navigate to `localhost:3000/home` to explore the initial features of the web app.

### About the file structure of the project:

1.  In brainstorm1 views, it includes all the pages responsible for the feature of browsing wikipedia, extracting raw text, and transtorming raw text using LLM.
2.  In brainstorm2 views, it includes the pages for the features of hightlighting a text from a wikipedia and generating a force directed graph.
3.  In the auth views folder, the login, register, terms and conditions are stored.
