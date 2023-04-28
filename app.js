const express = require('express'); // Require libraries
const mysql = require("mysql")  
const dotenv = require('dotenv')
const app = express(); //Initialise app
const cookieParser = require("cookie-parser"); // Cookies
const sessions = require('express-session'); // Sessions
const oneDay = 1000 * 60 * 60 * 24; // Day calculator
dotenv.config({ path: './.env'})
var session; // session variable

const db = mysql.createConnection({ // Create connection to SQL database
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})

db.connect((error) => { // Error Handling
    if(error) {
        console.log(error)
    } else {
        console.log("MySQL connected!")
    }
})

//Create tables in database if not already exists
db.query(`CREATE TABLE IF NOT EXISTS users
    (id INT(11) NOT NULL AUTO_INCREMENT,
	name VARCHAR(100) NOT NULL,
	email VARCHAR(100) NOT NULL,
	password VARCHAR(255) NOT NULL,
	PRIMARY KEY (id))`,
    (err, res) => {
        if(!err){
            console.log('users table created');
        } else {
            console.log(err.message);
        }
    db.end
});

db.query(`CREATE TABLE IF NOT EXISTS tasks
    (task_id INT(20) NOT NULL AUTO_INCREMENT,
	proj_id INT(20) NOT NULL,
	task_name VARCHAR(100) NOT NULL,
	task_desc VARCHAR(255) NOT NULL,
	progress INT(20) NOT NULL,
	start_date DATE NOT NULL,
	end_date DATE NOT NULL,
	PRIMARY KEY (task_id))`,
    (err, res) => {
        if(!err){
            console.log('tasks table created');
        } else {
            console.log(err.message);
        }
    db.end
});

db.query(`CREATE TABLE IF NOT EXISTS sharetask
    (share_id INT(20) NOT NULL AUTO_INCREMENT,
	task_id INT(20) NOT NULL,
	user_id INT(20) NOT NULL,
	name VARCHAR(100) NOT NULL,
	PRIMARY KEY (share_id))`,
    (err, res) => {
        if(!err){
            console.log('sharetask table created');
        } else {
            console.log(err.message);
        }
    db.end
});

db.query(`CREATE TABLE IF NOT EXISTS shareproj
    (share_id INT(20) NOT NULL AUTO_INCREMENT,
	proj_id INT(20) NOT NULL,
	user_id INT(20) NOT NULL,
	name VARCHAR(100) NOT NULL,
	PRIMARY KEY (share_id))`,
    (err, res) => {
        if(!err){
            console.log('shareproj table created');
        } else {
            console.log(err.message);
        }
    db.end
});

db.query(`CREATE TABLE IF NOT EXISTS projects
    (proj_id INT(20) NOT NULL AUTO_INCREMENT,
	proj_name VARCHAR(100) NOT NULL,
	proj_desc VARCHAR(255) NOT NULL,
	budget INT(20) NOT NULL,
	start_date DATE NOT NULL,
	end_date DATE NOT NULL,
    progress INT(20) NOT NULL,
    creator_id INT(20) NOT NULL,
	PRIMARY KEY (proj_id))`,
    (err, res) => {
        if(!err){
            console.log('projects table created');
        } else {
            console.log(err.message);
        }
    db.end
});

db.query(`CREATE TABLE IF NOT EXISTS activities
    (act_id INT(20) NOT NULL AUTO_INCREMENT,
    task_id INT(20) NOT NULL,
	act_name VARCHAR(100) NOT NULL,
	act_desc VARCHAR(255) NOT NULL,
    progress INT(20) NOT NULL,
    cost INT(20) NOT NULL,
	PRIMARY KEY (act_id))`,
    (err, res) => {
        if(!err){
            console.log('activities table created');
        } else {
            console.log(err.message);
        }
    db.end
});

app.set('view engine', 'hbs')

const path = require("path")

app.use(express.static(path.join(__dirname, 'public')));

app.use(sessions({ // Session handling
    secret: "secretkey",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false 
}));

app.use(cookieParser());

app.get("/", (req, res) => { // Get index page
    res.render("index")
})

app.listen(3000, ()=> { // Connect to host
    console.log("server started on port 3000")
})

app.get("/register", (req, res) => { // Registration Page
    res.render("register")
})

app.get("/home", (req, res) => { // Home Page
    if(session.userid){
        res.render("home", {
            username: session.username, // Send username to page
        })
    }else
    res.render("index")
})

app.get("/shared", (req, res) => { // Shared Page
    var projects = [];
    var tasks = [];
    db.query(`SELECT * FROM shareproj WHERE user_id = ?`, [session.userid], async (error, result1) => { // Get all projects with user id
        if(error){ // Error handling
            console.log(error)
        }
        result1.forEach(element => {
            db.query(`SELECT *, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date FROM projects WHERE proj_id = ?`, [element.proj_id], async (error, result2) => { // Get all projects with user id
                if(error){ // Error handling
                    console.log(error)
                }
                val = JSON.stringify(result2);
                val = val.substring(1, val.length-1);
                projects.push(val.trim());
            })
        })
        db.query(`SELECT * FROM sharetask WHERE user_id = ?`, [session.userid], async (error, result3) => { // Get all projects with user id
            if(error){ // Error handling
                console.log(error)
            }
            result3.forEach(element => {
                db.query(`SELECT *, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date FROM tasks WHERE task_id = ?`, [element.task_id], async (error, result4) => { // Get all projects with user id
                    if(error){ // Error handling
                        console.log(error)
                    }
                    val = JSON.stringify(result4);
                    val = val.substring(1, val.length-1);
                    tasks.push(val.trim());
                })
            })
            res.render("shared", {
                projects: projects, // Send projects to page
                tasks: tasks
            })
        })
    })
})

app.get("/newproj", (req, res) => { // New project Page
    res.render("new", {
        project: res //send res to page
    })
})

app.get("/editproj", (req, res) => { // Edit project Page
    db.query(`SELECT *, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date FROM projects WHERE proj_id = ?`, [session.proj_id], async (error, result) => { // Get all projects with user id
        if(error){ // Error handling
            console.log(error)
        }else{
            res.render("edit", {
                project: JSON.stringify(result) // Send projects to page
            })
        }
    })
})

app.get("/myproj", (req, res) => {
    db.query(`SELECT *, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date  FROM projects WHERE creator_id = ?`, [session.userid], async (error, result) => {
        if(error){
            console.log(error)
        }else{
            res.render("list", {
                projects: JSON.stringify(result)
            })
        }
    })
})

app.get("/shareproj", (req, res) => { // Share project Page
    db.query(`SELECT * FROM shareproj WHERE proj_id = ?`, [session.proj_id], async (error, result) => { // Get all projects with user id
        if(error){ // Error handling
            console.log(error)
        }else{
            res.render("share", {
                project: JSON.stringify(result) // Send projects to page
            })
        }
    })
})

app.get("/viewproj", (req, res) => { // View project Page
    db.query(`SELECT *, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date FROM projects WHERE proj_id = ?`, [session.proj_id], async (error, result1) => { // Get all projects with user id
        if(error){ // Error Handling
            console.log(error)
        }else{
            db.query(`SELECT *, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date FROM tasks WHERE proj_id = ? ORDER BY start_date ASC`, [session.proj_id], async (error, result2) => { // Get all tasks from project in date order
                if(error){
                    console.log(error)
                }else{
                    res.render("view", {
                        project: JSON.stringify(result1), // Send projects to page
                        tasks: JSON.stringify(result2) // Send tasks to page
                    })
                }
            })
        }
    })
})

app.get("/viewtask", (req, res) => { // View task Page
    db.query(`SELECT *, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date FROM tasks WHERE task_id = ?`, [session.task_id], async (error, result) => { // Get task with task id
        if(error){ // Error handling
            console.log(error)
        }else{
            res.render("view", {
                task: JSON.stringify(result) // Send task to page
            })
        }
    })
})

app.get("/tasks", (req, res) => { // Task list Page
    db.query(`SELECT *, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date  FROM tasks WHERE proj_id = ?`, [session.proj_id], async (error, result) => { // Select all tasks with project id
        if(error){ // Error handling
            console.log(error)
        }else{
            res.render("list", { 
                tasks: JSON.stringify(result) // Send tasks to page
            })
        }
    })
})

app.get("/newtask", (req, res) => { // New task Page
    db.query(`SELECT *, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date FROM projects WHERE proj_id = ?`, [session.proj_id], async (error, result) => { // Get project with project id
        if(error){ // Error handling
            console.log(error)
        }else{
            res.render("new", {
                projectdata: JSON.stringify(result) // send project to page
            })
        }
    })
})

app.get("/edittask", (req, res) => { // Edit task Page
    db.query(`SELECT *, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date FROM tasks WHERE task_id = ?`, [session.task_id], async (error, task) => { // get task with task id
        if(error){ // Error handling
            console.log(error)
        }else{
            db.query(`SELECT *, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date FROM projects WHERE proj_id = ?`, [session.proj_id], async (error, project) => { // get project with project id
                if(error){ // Error handling
                    console.log(error)
                }else{
                    res.render("edit", {
                        project1: JSON.stringify(project), // send project to page
                        task: JSON.stringify(task) // send task to page
                    })
                }
            })
        }
    })
})

app.get("/sharetask", (req, res) => { // Share task Page
    db.query(`SELECT * FROM sharetask WHERE task_id = ?`, [session.task_id], async (error, result) => { // Get all task with user id
        if(error){ // Error handling
            console.log(error)
        }else{
            res.render("share", {
                task: JSON.stringify(result) // Send task to page
            })
        }
    })
})

app.get("/acts", (req, res) => { // Activity list Page
    db.query('SELECT * FROM activities WHERE task_id = ?', [session.task_id], async (error, result) => { // get all activities with task id
        if(error){ // Error handling
            console.log(error)
        }else{
            res.render("list", {
                activities: JSON.stringify(result) // send activities to page
            })
        }
    })
})

app.get("/viewact", (req, res) => { // View activity Page
    db.query('SELECT * FROM activities WHERE act_id = ?', [session.activity_id], async (error, result) => { // get activity with activity id
        if(error){ // Error handling
            console.log(error)
        }else{
            res.render("view", {
                activity: JSON.stringify(result) // send activity to page
            })
        }
    })
})

app.get("/newact", (req, res) => { // New activity Page
    db.query(`SELECT *, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date FROM tasks WHERE task_id = ?`, [session.task_id], async (error, task) => { // Get task from task id
        if(error){ // Error handling
            console.log(error)
        }else{
            db.query(`SELECT *, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date FROM projects WHERE proj_id = ?`, [session.proj_id], async (error, project) => { // Get project from project id
                if(error){ // Error handling
                    console.log(error)
                }else{
                    res.render("new", {
                        projectdata1: JSON.stringify(project), // Send project to page
                        taskdata1: JSON.stringify(task) // Send task to page
                    })
                }
            })
        }
    })
})

app.get("/editact", (req, res) => { // Edit activity Page
    db.query('SELECT * FROM activities WHERE act_id = ?', [session.activity_id], async (error, activity) => { // Get activity from activity id
        if(error){ // Error handling
            console.log(error)
        }else{
            db.query(`SELECT *, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date FROM tasks WHERE task_id = ?`, [session.task_id], async (error, task) => { // Get task from task id
                if(error){ // Error handling
                    console.log(error)
                }else{
                    db.query(`SELECT *, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date FROM projects WHERE proj_id = ?`, [session.proj_id], async (error, project) => { // Get project from project id
                        if(error){ // Error handling
                            console.log(error)
                        }else{
                            res.render("edit", {
                                activity: JSON.stringify(activity), // send activity to page
                                project2: JSON.stringify(project), // send project to page
                                task1: JSON.stringify(task) // send task to page
                            })
                        }
                    })
                }
            })
        }
    })
})

app.get('/logout',(req,res) => { // logout page
    req.session.destroy(); // destroy session
    res.redirect('/'); // Redirect to index page
})

const bcrypt = require("bcryptjs") // Bcrypt used to encrypt data

app.use(express.json());

app.use(express.urlencoded({extended: true}))

app.post("/auth/register", (req, res) => {  // Authenticate user registration
    const { name, email, password, password_confirm } = req.body // Set constants from form
    if(password !== password_confirm) {
        return res.render('register', {
            message: 'Passwords do not match!'
        })
    }
    if(password.length < 8) {
        return res.render('register', {
            message: 'Password needs to be at least 8 characters long'
        })
    }
    if(name.length < 6) {
        return res.render('register', {
            message: 'Username needs to be at least 6 characters long'
        })
    }
    if(!email.includes('@')) {
        return res.render('register', {
            message: 'Email needs an @'
        })
    }
    db.query('SELECT name FROM users WHERE name = ?', [name], async (error, result) => { // get name in users
        if(error){ // Error handling
            console.log(error)
        }
        if(result.length > 0 ) {
            return res.render('register', {
                message: 'This username is already in use'
            })
        }
        db.query('SELECT email FROM users WHERE email = ?', [email], async (error, result) => { // get email in users
            if(error){ // Error handling
                console.log(error)
            }
            if(result.length > 0 ) {
                return res.render('register', {
                    message: 'This email is already in use'
                })
            }
            let hashedPassword = await bcrypt.hash(password, 8) // encrypt password
            db.query('INSERT INTO users SET?', {name: name, email: email, password: hashedPassword}, (error, result) => { // insert into users
                if(error) { // Error handling
                    console.log(error)
                } else {
                    return res.render('register', {
                        message: 'User registered!'
                    })
                }
            })
        })
    })
})

app.post("/auth/login", (req, res) => { // Authenticate user login
    const { email, password } = req.body // set constants from form
    db.query('SELECT * FROM users WHERE email = ?', [email], async (error, result) => { // get email from users 
        if(error){ // Error handling
            console.log(error)
        }
        if(result.length > 0 ) {
            pass=result[0].password;
            bcrypt.compare(password, pass, function(err, resulted){ // Compare passwords
                if(resulted == true){
                    session=req.session; // Set session values
                    session.userid=result[0].id;
                    session.username=result[0].name;
                    session.email=result[0].email;
                    return res.redirect('/home') // redirect to home
                }
                else if(resulted == false){
                    return res.render('index', {
                        message: 'Incorrect Credentials'
                    })
                }
            })
            return;
        }
        return res.render('index', {
            message: 'Incorrect Credentials'
        })
    })
})

app.post("/create/project", (req, res) => { // Create project 
    const { name, desc, budget, start_date, end_date } = req.body // set constants from form
    db.query('INSERT INTO projects SET?', {proj_name: name, proj_desc: desc, budget: budget, start_date: start_date, end_date: end_date, progress: 0, creator_id: session.userid}, (error, result) => { // insert project into project table
        if(error) { // Error handling
            console.log(error)
        } else {
            updateprogress() // update progress function
            res.redirect('/myproj') // redirect
        }
    })
})

app.post("/edit/project", (req, res) => { // Edit project
    const { name, desc, budget, start_date, end_date } = req.body // get constants from form
    var query = `UPDATE projects SET proj_name = "${name}", proj_desc = "${desc}", budget = "${budget}", start_date = "${start_date}", end_date = "${end_date}" WHERE proj_id = "${session.proj_id}"`; // update project in project table
    db.query(query, (error, result) => {
        if(error) { // Error handling
            console.log(error)
        } else {
            updateprogress() // update progress function
            res.redirect('/myproj') // redirect
        }
    })
})

app.post("/del/project", (req, res) => { // Delete project
    var query = `SELECT task_id FROM tasks WHERE proj_id = "${session.proj_id}"`; // get tasks with project id
    db.query(query, (error, result) => {
        if(error) { // Error handling
            console.log(error)
        } else {
            result.forEach(element => { // loop through each task
                session.task_id = element.task_id;
                var query = `DELETE FROM activities WHERE task_id = "${session.task_id}"`; // delete each activity with task id
                db.query(query, (error, result) => {
                    if(error) { // Error handling
                        console.log(error)
                    } else {
                        updateprogress() // call progress function
                    }
                })
                var query = `DELETE FROM sharetask WHERE task_id = "${session.task_id}"`; // delete each shared with task id
                db.query(query, (error, result) => {
                    if(error) { // Error handling
                        console.log(error)
                    } else {
                        updateprogress() // call progress function
                    }
                })
            })
            var query = `DELETE FROM tasks WHERE proj_id = "${session.proj_id}"`; // delete each task with project id
            db.query(query, (error, result) => {
                if(error) { // Error handling
                    console.log(error)
                } else {
                    updateprogress() // call progress function
                }
            })
            var query = `DELETE FROM shareproj WHERE proj_id = "${session.proj_id}"`; // delete each shared with project id
            db.query(query, (error, result) => {
                if(error) { // Error handling
                    console.log(error)
                } else {
                    updateprogress() // call progress function
                }
            })
            var query = `DELETE FROM projects WHERE proj_id = "${session.proj_id}"`; // delete project
            db.query(query, (error, result) => {
                if(error) { // Error handling
                    console.log(error)
                } else {
                    updateprogress() // call progress function
                    res.redirect('/myproj') // redirect
                }
            })
        }
    })
})

app.post("/share/project", (req, res) => { // Share project
    const { email } = req.body
    db.query('SELECT * FROM shareproj WHERE proj_id = ?', [session.proj_id], async (error, project) => { // Get all projects with user id
        if(error){ // Error handling
            console.log(error)
        }else{   
            if(email==session.email){
                return res.render('share',{
                    project: JSON.stringify(project),
                    message: 'Cannot add yourself!'
                })
            } else {
                db.query('SELECT * FROM users WHERE email = ?', [email] , async (error, result) => { // get email from users 
                    if(error) { // Error handling
                        console.log(error)
                    }
                    if(result.length == 0){
                        return res.render('share', {
                            project: JSON.stringify(project),
                            message: 'User does not exist!'
                        })
                    } else {
                        var userid = result[0].id;
                        var username = result[0].name;
                        db.query('SELECT * FROM shareproj WHERE user_id = ? AND proj_id = ?', [userid, session.proj_id] , async (error, result) => { // get all from shared table
                            if(error) { // Error handling
                                console.log(error)
                            }
                            if(result.length > 0){
                                return res.render('share', {
                                    project: JSON.stringify(project),
                                    message: 'User already added!'
                                })
                            } else {
                                db.query('INSERT INTO shareproj SET?', {proj_id: session.proj_id, user_id: userid, name: username}, (error, result) => { // Insert into shared table
                                    if(error) { // Error handling
                                        console.log(error)
                                    } else {
                                        db.query('SELECT * FROM shareproj WHERE proj_id = ?', [session.proj_id], async (error, project) => { // Get all shared with proj id
                                            if(error){ // Error handling
                                                console.log(error)
                                            }else{ 
                                                return res.render('share', {
                                                    project: JSON.stringify(project),
                                                    message: 'User added!'
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        }
    })
})

app.post("/project", (req, res) => { // Project Selection
    const { ID, type} = req.body // set constants from form
    session.proj_id = ID // set session project id
    if(type == "edit"){
        return res.redirect('/editproj') // redirect
    }
    if(type == "share"){
        return res.redirect('/shareproj') // redirect
    }
    if(type == "view"){
        return res.redirect('/viewproj') // redirect
    }
})

app.post("/create/task", (req, res) => { // Create task
    const { name, desc, start_date, end_date } = req.body // set constants from form
    db.query('INSERT INTO tasks SET?', {proj_id: session.proj_id, task_name: name, task_desc: desc, start_date: start_date, end_date: end_date, progress: 0}, (error, result) => { // insert data into task table
        if(error) { // Error handling
            console.log(error)
        } else {
            updateprogress() // call update progress
            res.redirect('/tasks') // redirect
        }
    })
})

app.post("/edit/task", (req, res) => { // Edit Task
    const { name, desc, start_date, end_date } = req.body // Set constants from form
    var query = `UPDATE tasks SET task_name = "${name}", task_desc = "${desc}", start_date = "${start_date}", end_date = "${end_date}" WHERE task_id = "${session.task_id}"`; // update task in task table
    db.query(query, (error, result) => {
        if(error) { // Error handling
            console.log(error)
        } else {
            updateprogress() // call update progress function
            res.redirect('/tasks') // redirect
        }
    })
})

app.post("/del/task", (req, res) => { // Delete Task
    var query = `SELECT act_id FROM activities WHERE task_id = "${session.task_id}"`; // Get activities from task id
    db.query(query, (error, result) => {
        if(error) { // Error handling
            console.log(error)
        } else {
            result.forEach(element => { // loop through each activity
                session.activity_id = element.act_id; // set session variable
                var query = `UPDATE projects SET budget = budget + (SELECT cost FROM activities WHERE act_id = "${session.activity_id}") WHERE proj_id = "${session.proj_id}"`; // add cost of activity back to project budget
                db.query(query, (error, result) => {
                    if(error) { // Error handling
                        console.log(error)
                    } else {
                        var query = `DELETE FROM activities WHERE act_id = "${session.activity_id}"`; // Delete activity from activity table
                        db.query(query, (error, result) => {
                            if(error) { // Error handling
                                console.log(error)
                            } else {
                                updateprogress() // call update progress function
                            }
                        })
                    }
                })
            });
            var query = `DELETE FROM sharetask WHERE task_id = "${session.task_id}"`; // delete shared task from task table
            db.query(query, (error, result) => {
                if(error) { // Error handling
                    console.log(error)
                } else {
                    updateprogress() // call update progress function
                }
            })
            var query = `DELETE FROM tasks WHERE task_id = "${session.task_id}"`; // delete task from task table
            db.query(query, (error, result) => {
                if(error) { // Error handling
                    console.log(error)
                } else {
                    updateprogress() // call update progress function
                    res.redirect('/tasks') // redirect
                }
            })
        }
    })
})

app.post("/share/task", (req, res) => { // Share Task
    const { email } = req.body
    db.query('SELECT * FROM sharetask WHERE task_id = ?', [session.task_id], async (error, task) => { // Get all shared with task id
        if(error){ // Error handling
            console.log(error)
        }else{   
            if(email==session.email){
                return res.render('share',{
                    task: JSON.stringify(task),
                    message: 'Cannot add yourself!'
                })
            } else {
                db.query('SELECT * FROM users WHERE email = ?', [email] , async (error, result) => { // get email from users 
                    if(error) { // Error handling
                        console.log(error)
                    }
                    if(result.length == 0){
                        return res.render('share', {
                            task: JSON.stringify(task),
                            message: 'User does not exist!'
                        })
                    } else {
                        var userid = result[0].id;
                        var username = result[0].name;
                        db.query('SELECT * FROM sharetask WHERE user_id = ? AND task_id = ?', [userid, session.task_id] , async (error, result) => { // get all from shared table from user id
                            if(error) { // Error handling
                                console.log(error)
                            }
                            if(result.length > 0){
                                return res.render('share', {
                                    task: JSON.stringify(task),
                                    message: 'User already added!'
                                })
                            } else {
                                db.query('INSERT INTO sharetask SET?', {task_id: session.task_id, user_id: userid, name: username}, (error, result) => { // Insert into shared table
                                    if(error) { // Error handling
                                        console.log(error)
                                    } else {
                                        db.query('SELECT * FROM sharetask WHERE task_id = ?', [session.task_id], async (error, task) => { // Get all shared with task id
                                            if(error){ // Error handling
                                                console.log(error)
                                            }else{ 
                                                return res.render('share', {
                                                    project: JSON.stringify(task),
                                                    message: 'User added!'
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        }
    })
})

app.post("/select/tasks", (req, res) => { // Task Selection
    const { ID, type} = req.body // set constants from form
    session.task_id = ID // set session task id
    if(type == "edit"){
        return res.redirect('/edittask') // redirect
    }
    if(type == "share"){
        return res.redirect('/sharetask') // redirect
    }
    if(type == "view"){
        return res.redirect('/viewtask') // redirect
    }
})

app.post("/create/act", (req, res) => { // Create activity
    const { name, desc, progress, cost } = req.body // set constants from form
    db.query('INSERT INTO activities SET?', {task_id: session.task_id, act_name: name, act_desc: desc, progress: progress, cost: cost}, (error, result) => { // Insert activity into activity table
        if(error) { // Error handling
            console.log(error)
        } else {
            var query = `UPDATE projects SET budget = budget - "${cost}" WHERE proj_id = "${session.proj_id}"`; // update project and decrease budget by cost of activity
            db.query(query, (error, result) => {
                if(error) { // Error handling
                    console.log(error)
                } else {
                    updateprogress() // call update progress function
                    res.redirect('/acts') // redirect
                }
            })
        }
    })
})

app.post("/edit/act", (req, res) => { // Edit activity
    const { name, desc, progress, cost } = req.body // set constants from form
    var query = `UPDATE projects SET budget = budget + (SELECT cost FROM activities WHERE act_id = "${session.activity_id}") WHERE proj_id = "${session.proj_id}"`; // Update projects and add cost of old activity to budget
    db.query(query, (error, result) => {
        if(error) { // Error handling
            console.log(error)
        } else {
            var query = `UPDATE activities SET act_name = "${name}", act_desc = "${desc}", progress = "${progress}", cost = "${cost}" WHERE act_id = "${session.activity_id}"`; // Update activity with new activity data
            db.query(query, (error, result) => {
                if(error) { // Error handling
                    console.log(error)
                } else {
                    var query = `UPDATE projects SET budget = budget - "${cost}" WHERE proj_id = "${session.proj_id}"`; // Update project and decrease budget by cost of new activity
                    db.query(query, (error, result) => {
                        if(error) { // Error handling
                            console.log(error)
                        } else {
                            updateprogress() // call update progress function
                            res.redirect('/acts') // redirect
                        }
                    })
                }
            })
        }
    })
})

app.post("/del/act", (req, res) => { // Delete activity
    var query = `UPDATE projects SET budget = budget + (SELECT cost FROM activities WHERE act_id = "${session.activity_id}") WHERE proj_id = "${session.proj_id}"`; // Update projects and add back cost of activity to budget
    db.query(query, (error, result) => {
        if(error) { // Error handling
            console.log(error)
        } else {
            var query = `DELETE FROM activities WHERE act_id = "${session.activity_id}"`; // delete activity with act id
            db.query(query, (error, result) => {
                if(error) { // Error handling
                    console.log(error)
                } else {
                    updateprogress() // call update progress function
                    res.redirect('/acts') // redirect
                }
            })
        }
    })
})

app.post("/select/activities", (req, res) => { // Activity Selection
    const { ID, type} = req.body // set constants from form
    session.activity_id = ID // set session activity id
    if(type == "edit"){
        return res.redirect('/editact') // redirect
    }
    if(type == "view"){
        return res.redirect('/viewact') // redirect
    }
})

app.post("/select/task", (req, res) => { // Task Selection from gantt chart 
    const { ID } = req.body // set constants form form
    session.task_id = ID // set session task id
    return res.redirect('/acts') // Redirect
})

app.post("/delete/sharedproj", (req, res) => { // Delete shared project
    const { ID } = req.body
    var query = `DELETE FROM shareproj WHERE user_id = ${ID} AND proj_id = "${session.proj_id}"`; // delete shared project with user id and proj id
    db.query(query, (error, result) => {
        if(error) { // Error handling
            console.log(error)
        } else {
            db.query('SELECT * FROM shareproj WHERE proj_id = ?', [session.proj_id], async (error, project) => { // Get all shared with proj id
                if(error){ // Error handling
                    console.log(error)
                }else{ 
                    return res.render('share', {
                        project: JSON.stringify(project),
                        message: 'User deleted!'
                    })
                }
            })
        }
    })
})

app.post("/delete/sharedtask", (req, res) => { // Delete shared task
    const { ID } = req.body
    var query = `DELETE FROM sharetask WHERE user_id = ${ID} AND task_id = "${session.task_id}"`; // delete shared tasks with user id and task id
    db.query(query, (error, result) => {
        if(error) { // Error handling
            console.log(error)
        } else {
            db.query('SELECT * FROM sharetask WHERE task_id = ?', [session.task_id], async (error, task) => { // Get all shared with task id
                if(error){ // Error handling
                    console.log(error)
                }else{ 
                    return res.render('share', {
                        task: JSON.stringify(task),
                        message: 'User deleted!'
                    })
                }
            })
        }
    })
})

function updateprogress(){ // Update progress function
    //Update Task Progress
    var query = `UPDATE tasks SET progress = 0`; // Update tasks to progress = 0
    db.query(query, (error, result) => {
        if(error) { // Error handling
            console.log(error)
        } else {
            var query = `SELECT * FROM activities`; // Select all activities 
            db.query(query, (error, result) => {
                if(error) { // Error handling
                    console.log(error)
                } else {
                    result.forEach(Element => { // Loop through activities
                        var query = `UPDATE tasks SET progress = progress + ${Element.progress} WHERE task_id = "${Element.task_id}"`; // Add progress of each activity to task
                        db.query(query, (error, result) => {
                            if(error) { // Error handling
                                console.log(error)
                            } else {
                                return; // return
                            }
                        })
                    })
                }
            })
        }
    })
    //Update Project Progress
    var query = `UPDATE projects SET progress = 0`; // Update project to progress = 0
    db.query(query, (error, result) => {
        if(error) { // Error handling
            console.log(error)
        } else {
            var query = `SELECT * FROM tasks`; // Select all tasks 
            db.query(query, (error, result) => {
                if(error) { // Error handling
                    console.log(error)
                } else {
                    result.forEach(Element => { // Loop through tasks
                        var query = `UPDATE projects SET progress = (SELECT SUM(progress) / COUNT(*) FROM tasks WHERE proj_id = "${Element.proj_id}") WHERE proj_id = "${Element.proj_id}"`; // add progress of each tasks to project
                        db.query(query, (error, result) => {
                            if(error) { // Loop through activities
                                console.log(error)
                            } else {
                                return; // return
                            }
                        })
                    })

                }
            })
        }
    })
}