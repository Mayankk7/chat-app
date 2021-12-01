
const http = require("http");
const express = require("express")

const app= express();
const socketio = require("socket.io")
const Filter = require("bad-words")
const server = http.createServer(app)
const io = socketio(server);

const path = require("path")

const publicDirectoryPath = path.join(__dirname,"../public")
const port = process.env.PORT || 3000;

app.use(express.static(publicDirectoryPath));

let count = 0;

io.on('connection', (socket)=>{
    console.log("New connection");

    socket.emit('message' , 'Welcome');
    socket.broadcast.emit('message', 'new user Joined')

    socket.on('sendMessage',(message, callback) => {
        const filter = new Filter();

        if(filter.isProfane(message)){
            return callback('Profanity not allowed');
        }
        
        io.emit('message', message);
        callback()
    });

    socket.on('disconnect', ()=>{
        io.emit('message', 'A user has left');
    })

    socket.on('sendLocation', (coords, callback) =>{
        io.emit('locationmessage',`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`)
        callback()
    })

})
server.listen(port, ()=> {
    console.log(`Server started at port : ${port}`)
})