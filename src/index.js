
const express = require("express")

const route = require("../src/routes/route");
const { default : mongoose} = require ("mongoose");
const multer = require("multer")

const app = express();
mongoose.set('strictQuery', true);
app.use( multer().any())
app.use(express.json())

mongoose.connect("mongodb+srv://YuktaSadana:yuiopjkl@cluster0.ikfqj5s.mongodb.net/project05",
 { useNewUrlParser : true}
)
.then(() => console.log("MongoDB is connected"))
.catch((err)=>console.log(err));


app.use("/", route);

app.listen(process.env.PORT || 3000 , function(){
   console.log("Express is running on Port" + (process.env.PORT || 3000))
});

