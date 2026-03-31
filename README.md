# Join – Task Management Application

Join is a web-based task management application inspired by a Kanban board.  
It helps users organize tasks, manage contacts, and track progress in a clear and structured way.

## Features

- Create, edit, and delete tasks  
- Assign contacts to tasks  
- Organize tasks using a Kanban board (To Do, In Progress, Await Feedback, Done)  
- Manage contacts with initials and color avatars  
- Responsive design for desktop and mobile devices  

## Technologies

- HTML  
- CSS  
- JavaScript  
- Firebase Realtime Database  

## Configuration

To connect the app to a Firebase Realtime Database, create a local config file.

1. Create the file `javascript/app.config.js`.
2. Add your Firebase database URL in `FIREBASE_DB_URL`.
3. Make sure the file name is exactly `app.config.js`.

Example:

```js
(function (global) {
	const defaultConfig = {FIREBASE_DB_URL: "https://YOUR-PROJECT-default-rtdb.firebaseio.com/",};

	global.APP_CONFIG = Object.assign({}, defaultConfig, global.APP_CONFIG || {});

	global.getFirebaseDbUrl = function () {
		const rawUrl = (global.APP_CONFIG && global.APP_CONFIG.FIREBASE_DB_URL) || "";
		if (!rawUrl) return "";
		return rawUrl.endsWith("/") ? rawUrl : rawUrl + "/";
	};
})(window);
```

Note: The repository ignores `javascript/app.config.js`, so each developer must create this file locally.

## Project Structure

- index.html – Main entry page  
- style.css – Styling of the application  
- script.js – Main application logic  
- javascript/ – Additional JavaScript files  
- subpages/ – Additional pages of the application  

## Live Demo

You can view the project here:  
https://join-2486.developerakademie.net/join/index.html

## Contributors

This project was developed as a group project during the Developer Akademie web development training program.
small repository update


Developed in collaboration with:

- Habiba  
- Malik  
- Olga  

## Author

Created as part of the Developer Akademie training program.
