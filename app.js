const express = require('express');
const mysql = require("mysql")
const dotenv = require('dotenv')
const app = express();
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const oneDay = 1000 * 60 * 60 * 24;
dotenv.config({ path: './.env'})
var session;

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})

db.connect((error) => {
    if(error) {
        console.log(error)
    } else {
        console.log("MySQL connected!")
    }
})

app.set('view engine', 'hbs')

const path = require("path")

app.use(express.static(path.join(__dirname, 'public')));

app.use(sessions({
    secret: "secretkey",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false 
}));

app.use(cookieParser());

app.get("/", (req, res) => {
    res.render("index")
})
app.listen(3000, ()=> {
    console.log("server started on port 3000")
})
app.get("/register", (req, res) => {
    res.render("register")
})
app.get("/home", (req, res) => {
    if(session.userid){
        res.render("home", {
            username: session.username,
        })
    }else
    res.redirect("index")
})
app.get("/myproj", (req, res) => {
    db.query('SELECT * FROM projects WHERE creator_id = ?', [session.userid], async (error, result) => {
        if(error){
            console.log(error)
        }else{
            res.render("myproj", {
                projects: JSON.stringify(result)
            })
        }
    })
})
app.get("/sharedproj", (req, res) => {
    res.render("sharedproj")
})
app.get("/newproj", (req, res) => {
    res.render("newproj")
})
app.get("/editproj", (req, res) => {
    db.query('SELECT * FROM projects WHERE proj_id = ?', [session.proj_id], async (error, result) => {
        if(error){
            console.log(error)
        }else{
            res.render("editproj", {
                project: JSON.stringify(result)
            })
        }
    })
})
app.get("/viewproj", (req, res) => {
    db.query('SELECT * FROM projects WHERE proj_id = ?', [session.proj_id], async (error, result) => {
        if(error){
            console.log(error)
        }else{
            res.render("viewproj", {
                project: JSON.stringify(result)
            })
        }
    })
})
app.get("/tasks", (req, res) => {
    db.query('SELECT * FROM tasks WHERE proj_id = ?', [session.proj_id], async (error, result) => {
        if(error){
            console.log(error)
        }else{
            res.render("tasks", {
                tasks: JSON.stringify(result)
            })
        }
    })
})
app.get("/viewtask", (req, res) => {
    db.query('SELECT * FROM tasks WHERE task_id = ?', [session.task_id], async (error, result) => {
        if(error){
            console.log(error)
        }else{
            res.render("viewtask", {
                task: JSON.stringify(result)
            })
        }
    })
})
app.get("/newtask", (req, res) => {
    db.query('SELECT * FROM projects WHERE proj_id = ?', [session.proj_id], async (error, result) => {
        if(error){
            console.log(error)
        }else{
            res.render("newtask", {
                project: JSON.stringify(result)
            })
        }
    })
})
app.get("/edittask", (req, res) => {
    db.query('SELECT * FROM tasks WHERE task_id = ?', [session.task_id], async (error, task) => {
        if(error){
            console.log(error)
        }else{
            db.query('SELECT * FROM projects WHERE proj_id = ?', [session.proj_id], async (error, project) => {
                if(error){
                    console.log(error)
                }else{
                    res.render("edittask", {
                        project: JSON.stringify(project),
                        task: JSON.stringify(task)
                    })
                }
            })
        }
    })
})
app.get("/acts", (req, res) => {
    db.query('SELECT * FROM activities WHERE task_id = ?', [session.task_id], async (error, result) => {
        if(error){
            console.log(error)
        }else{
            res.render("acts", {
                activities: JSON.stringify(result)
            })
        }
    })
})
app.get("/viewact", (req, res) => {
    db.query('SELECT * FROM activities WHERE act_id = ?', [session.activity_id], async (error, result) => {
        if(error){
            console.log(error)
        }else{
            res.render("viewact", {
                activity: JSON.stringify(result)
            })
        }
    })
})
app.get("/newact", (req, res) => {
    db.query('SELECT * FROM tasks WHERE task_id = ?', [session.task_id], async (error, task) => {
        if(error){
            console.log(error)
        }else{
            db.query('SELECT * FROM projects WHERE proj_id = ?', [session.proj_id], async (error, project) => {
                if(error){
                    console.log(error)
                }else{
                    res.render("newact", {
                        project: JSON.stringify(project),
                        task: JSON.stringify(task)
                    })
                }
            })
        }
    })
})
app.get("/editact", (req, res) => {
    db.query('SELECT * FROM activities WHERE act_id = ?', [session.activity_id], async (error, activity) => {
        if(error){
            console.log(error)
        }else{
            db.query('SELECT * FROM tasks WHERE task_id = ?', [session.task_id], async (error, task) => {
                if(error){
                    console.log(error)
                }else{
                    db.query('SELECT * FROM projects WHERE proj_id = ?', [session.proj_id], async (error, project) => {
                        if(error){
                            console.log(error)
                        }else{
                            res.render("editact", {
                                activity: JSON.stringify(activity),
                                project: JSON.stringify(project),
                                task: JSON.stringify(task)
                            })
                        }
                    })
                }
            })
        }
    })
})

const bcrypt = require("bcryptjs")

app.use(express.json());

app.use(express.urlencoded({extended: true}))

app.post("/auth/register", (req, res) => {    
    const { name, email, password, password_confirm } = req.body
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
    db.query('SELECT name FROM users WHERE name = ?', [name], async (error, result) => {
        if(error){
            console.log(error)
        }
        if(result.length > 0 ) {
            return res.render('register', {
                message: 'This username is already in use'
            })
        }
        db.query('SELECT email FROM users WHERE email = ?', [email], async (error, result) => {
            if(error){
                console.log(error)
            }
            if(result.length > 0 ) {
                return res.render('register', {
                    message: 'This email is already in use'
                })
            }
            let hashedPassword = await bcrypt.hash(password, 8)
            db.query('INSERT INTO users SET?', {name: name, email: email, password: hashedPassword}, (error, result) => {
                if(error) {
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

app.post("/auth/login", (req, res) => {
    const { email, password } = req.body
    db.query('SELECT * FROM users WHERE email = ?', [email], async (error, result) => {
        if(error){
            console.log(error)
        }
        if(result.length > 0 ) {
            pass=result[0].password;
            bcrypt.compare(password, pass, function(err, resulted){
                if(resulted == true){
                    session=req.session;
                    session.userid=result[0].id;
                    session.username=result[0].name;
                    session.email=result[0].email;
                    return res.redirect('/home')
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

app.post("/create/project", (req, res) => {
    const { name, desc, budget, start_date, end_date } = req.body
    db.query('INSERT INTO projects SET?', {proj_name: name, proj_desc: desc, budget: budget, start_date: start_date, end_date: end_date, progress: 0, creator_id: session.userid}, (error, result) => {
        if(error) {
            console.log(error)
        } else {
            res.redirect('/myproj')
        }
    })
})

app.post("/edit/project", (req, res) => {
    const { name, desc, budget, start_date, end_date } = req.body
    var query = `UPDATE projects SET proj_name = "${name}", proj_desc = "${desc}", budget = "${budget}", start_date = "${start_date}", end_date = "${end_date}" WHERE proj_id = "${session.proj_id}"`;
    db.query(query, (error, result) => {
        if(error) {
            console.log(error)
        } else {
            res.redirect('/myproj')
        }
    })
})

app.post("/del/project", (req, res) => {
    var query = `DELETE FROM projects WHERE proj_id = "${session.proj_id}"`;
    db.query(query, (error, result) => {
        if(error) {
            console.log(error)
        } else {
            res.redirect('/myproj')
        }
    })
})

app.post("/project", (req, res) => {
    const { ID, type} = req.body
    session.proj_id = ID
    if(type == "edit"){
        return res.redirect('/editproj')
    }
    if(type == "view"){
        return res.redirect('/viewproj')
    }
})

app.post("/create/task", (req, res) => {
    const { name, desc, start_date, end_date } = req.body
    db.query('INSERT INTO tasks SET?', {proj_id: session.proj_id, task_name: name, task_desc: desc, start_date: start_date, end_date: end_date, progress: 0}, (error, result) => {
        if(error) {
            console.log(error)
        } else {
            res.redirect('/tasks')
        }
    })
})

app.post("/edit/task", (req, res) => {
    const { name, desc, start_date, end_date } = req.body
    var query = `UPDATE tasks SET task_name = "${name}", task_desc = "${desc}", start_date = "${start_date}", end_date = "${end_date}" WHERE task_id = "${session.task_id}"`;
    db.query(query, (error, result) => {
        if(error) {
            console.log(error)
        } else {
            res.redirect('/tasks')
        }
    })
})

app.post("/del/task", (req, res) => {
    var query = `DELETE FROM tasks WHERE task_id = "${session.task_id}"`;
    db.query(query, (error, result) => {
        if(error) {
            console.log(error)
        } else {
            res.redirect('/tasks')
        }
    })
})

app.post("/select/tasks", (req, res) => {
    const { ID, type} = req.body
    session.task_id = ID
    if(type == "edit"){
        return res.redirect('/edittask')
    }
    if(type == "view"){
        return res.redirect('/viewtask')
    }
})

app.post("/create/act", (req, res) => {
    const { name, desc, progress, cost } = req.body
    db.query('INSERT INTO activities SET?', {task_id: session.task_id, act_name: name, act_desc: desc, progress: progress, cost: cost}, (error, result) => {
        if(error) {
            console.log(error)
        } else {
            res.redirect('/acts')
        }
    })
})

app.post("/edit/act", (req, res) => {
    const { name, desc, progress, cost } = req.body
    var query = `UPDATE activities SET act_name = "${name}", act_desc = "${desc}", progress = "${progress}", cost = "${cost}" WHERE act_id = "${session.activity_id}"`;
    db.query(query, (error, result) => {
        if(error) {
            console.log(error)
        } else {
            res.redirect('/acts')
        }
    })
})

app.post("/del/act", (req, res) => {
    var query = `DELETE FROM activities WHERE act_id = "${session.activity_id}"`;
    db.query(query, (error, result) => {
        if(error) {
            console.log(error)
        } else {
            res.redirect('/acts')
        }
    })
})

app.post("/select/activities", (req, res) => {
    const { ID, type} = req.body
    session.activity_id = ID
    if(type == "edit"){
        return res.redirect('/editact')
    }
    if(type == "view"){
        return res.redirect('/viewact')
    }
})

//app.post("/update/progress", (req, res) => {
//
//})

app.get('/logout',(req,res) => {
    req.session.destroy();
    res.redirect('/');
});