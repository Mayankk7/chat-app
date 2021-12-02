
const http = require("http");
const express = require("express")

const app= express();
const socketio = require("socket.io")
const Filter = require("bad-words")
const server = http.createServer(app)
const io = socketio(server);
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser,getUserInRoom,getUser,removeUser} = require('./utils/users')

const path = require("path")

const publicDirectoryPath = path.join(__dirname,"../public")
const port = process.env.PORT || 3000;

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket)=>{
    console.log("New connection");

    socket.on('join', (options, callback)=> {
           
        const {error, user} = addUser({ id: socket.id, ...options })


        if(error){
            return callback(error);
        }

        socket.join(user.room)

        socket.emit('message' ,generateMessage('Welcome') );
        socket.broadcast.to(user.room).emit('Admin', generateMessage(`${user.username} has joined !`))
        io.to(user.room).emit('roomData', {
            room:user.room,
            users : getUserInRoom(user.room)
        })

        callback()
    })


    socket.on('sendMessage',(message, callback) => {
        const filter = new Filter();
        const user = getUser(socket.id)
 
        if(filter.isProfane(message)){
            return callback('Profanity not allowed');
        }
        
        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback()
    });

    socket.on('disconnect', ()=>{

        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage("Admin",`${user.username} has left`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users : getUserInRoom(user.room)
            })
        }
        
    })

    socket.on('sendLocation', (coords, callback) =>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationmessage',generateLocationMessage(user.username, `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

})
server.listen(port, ()=> {
    console.log(`Server started at port : ${port}`)
})