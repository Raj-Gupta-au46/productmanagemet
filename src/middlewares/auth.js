const jwt = require('jsonwebtoken')
const userModel = require("../models/userModel")
const validate = require("../Validators/validation")

//========================================= authentication ======================================================


let Authentication = async (req, res, next) => {
    try {
        let bearerHeader = req.headers.authorization;
        if (typeof bearerHeader == "undefined") {
            return res.status(401).send({ status: false, message: "Token is missing! please enter token." });
        }
        let bearerToken = bearerHeader.split(' '); // converting it to array 
        let token = bearerToken[1];
        jwt.verify(token, "project/booksManagementGroup05", function (error, data) {
            if (error && error.message == "jwt expired") {
                return res.status(401).send({ status: false, message: "Session expired! Please login again." })
            }
            if (error) {
                return res.status(401).send({ status: false, message: "Incorrect token" })
            }
            else {
                req.decodedToken = data.userId;

                next()
            }
        });
    } catch (error) {
        return res.status(500).send({ status: false, error: error.message });
    }
}


//========================================  authorisation =============================================


let authorization = async function (req, res, next) {
    try {
        let userid = req.params.userId
        let validUser = req.decodedToken // userid from token
        //===================== format of userid ===============================================
        if (!validate.isValidObjectId(userid)) {
            return res.status(400).send({ status: false, message: "Invalid Format of User Id" })
        }

        let user = await userModel.findById(userid)
        if (user) {
            let users = user._id.toString() //userId from user
            if (users !== validUser) {
                return res.status(403).send({ status: false, message: "Sorry! Unauthorized User" })
            }
            next()
        }
        else {
            return res.status(404).send({ status: false, message: "user not found or userId does not exist" })
        }
    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}


module.exports.Authentication=Authentication
module.exports.authorization=authorization