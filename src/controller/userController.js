const userModel = require("../models/userModel")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const saltRounts = 10
const uploadFile = require("../aws/aws")

const validator = require("../Validators/validation");
const { default: mongoose } = require("mongoose");




//========================================== creating user ===========================================
const createUser = async function (req, res) {
    try {
        let requestBody = req.body;
        let files = req.files
        const { fname, lname, email, password, phone, address } = requestBody //Destructuring
        //=========================== if body is empty ==================================================
        if (!validator.isValidBody(requestBody)) return res.status(400).send({ status: false, msg: "Enter some data to create user" })

        //============================= validation for fname ============================================
        if (!fname) return res.status(400).send({ status: false, msg: "fname is mandatory" })
        if (!validator.isValidName(fname)) return res.status(400).send({ status: false, msg: "fname is not valid" })

        //===========================  validations for lname =============================================
        if (!lname) return res.status(400).send({ status: false, msg: "lname is mandatory" })
        if (!validator.isValidName(lname)) return res.status(400).send({ status: false, msg: "lname is not valid" })

        //=============================== validation for email ============================================
        if (!email) return res.status(400).send({ status: false, msg: "email is mandatory" })
        if (!validator.isValidEmail(email)) return res.status(400).send({ status: false, message: "Email is invalid" })
        let emailCheck = await userModel.findOne({ email: email })
        if (emailCheck) return res.status(409).send({ status: false, msg: "email is already used " })
        requestBody.email = email.toLowerCase()

        //============================= validation for password ===================================================
        if (!password) return res.status(400).send({ status: false, msg: "password is mandatory" })
        if (!validator.isValidPassword(password)) return res.status(400).send({ status: false, message: "password is invalid ,it should be of minimum 8 digits and maximum of 15 and should have atleast one special character and one number & one uppercase letter" })
        const salt = await bcrypt.genSalt(saltRounts)
        requestBody.password = await bcrypt.hash(password, salt) //using bcrypt for password hashing

        //=========================== validation for phone ==================================================
        if (!phone) return res.status(400).send({ status: false, msg: "phone is mandatory" })
        if (!validator.isValidPhone(phone)) return res.status(400).send({ status: false, msg: "phone number is invalid , it should be starting with 6-9 and having 10 digits" })
        let phoneCheck = await userModel.findOne({ phone: requestBody.phone })
        if (phoneCheck) return res.status(409).send({ status: false, msg: "phone number is already used" })

        //============================== validation for profileimage =====================================
        if (!files && files.length == 0) return res.status(400).send({ status: false, msg: "profileImage is mandatory" })
        
        let Image = await uploadFile(files[0]) // using aws for link creation 
        if (!validator.validImage(Image)) {
            return res.status(400).send({ status: false, msg: "profileImage is in incorrect format" })
        }
        requestBody.profileImage = Image

        //================================== validation for address =====================================
        if (!address) return res.status(400).send({ status: false, msg: "address is mandatory" })
        if (address) {
            let Address
            try {
                Address = JSON.parse(address)
            }
            catch (err) {
                return res.status(400).send({ status: false, message: "please provide adress in JSON object" })
            }
            if (typeof Address != "object") {
                return res.status(400).send({ status: false, message: "Address is in wrong format" })
            }

            if (!Address.shipping) return res.status(400).send({ status: false, message: "Shipping is not present" })
            if (Address.shipping) {
                if (typeof Address.shipping != "object") {
                    return res.status(400).send({ status: false, message: "Shipping Address is in wrong format" })
                }
                if (!Address.shipping.street) return res.status(400).send({ status: false, msg: "street is mandatory in Shipping" })
                if (!Address.shipping.city) return res.status(400).send({ status: false, msg: "city is mandatory in Shipping" })
                if (!Address.shipping.pincode) return res.status(400).send({ status: false, msg: "pincode is mandatory in Shipping" })
                if (!validator.isValidName(Address.shipping.city)) return res.status(400).send({ status: false, msg: "city name is not valid" })
                if (!validator.isValidPincode(Address.shipping.pincode)) return res.status(400).send({ status: false, msg: "Pincode is not valid" })
            }

            if (!Address.billing) return res.status(400).send({ status: false, message: "billing is not present" })
            if (Address.billing) {
                if (typeof Address.billing != "object") {
                    return res.status(400).send({ status: false, message: "Shipping Address is in wrong format" })
                }
                if (!Address.billing.street) return res.status(400).send({ status: false, msg: "street is mandatory in billing" })
                if (!Address.billing.city) return res.status(400).send({ status: false, msg: "city is mandatory in billing" })
                if (!Address.billing.pincode) return res.status(400).send({ status: false, msg: "pincode is mandatory in billing" })
                if (!validator.isValidName(Address.billing.city)) return res.status(400).send({ status: false, msg: " city name is not valid" })
                if (!validator.isValidPincode(Address.billing.pincode)) return res.status(400).send({ status: false, msg: "Pincode is not valid" })
            }
        }
        requestBody.address = JSON.parse(requestBody.address)

        //=========================== user creation ==========================================
        let created = await userModel.create(requestBody)
        res.status(201).send({ status: true, msg: "User successfully created", data: created })
    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}




//========================================= user login =====================================================
const loginUser = async function (req, res) {
    try {
        let loginData = req.body
        let { email, password } = loginData

        //=========================== if body is empty ===============================================
        if (!validator.isValidBody(loginData)) return res.status(400).send({ status: false, message: "Please fill email or password" })
        //============================== if email not entered =======================================
        if (!validator.isValidEmail(email)) {
            return res.status(400).send({ status: false, message: `Please fill valid or mandatory email ` })
        }
        //============================ if password not entered ==========================================
        if (!password)
            return res.status(400).send({ status: false, message: `Please fill valid or mandatory password ` })

        //=============================== if user does not exist ===========================================
        let user = await userModel.findOne({ email: loginData.email });
        if (!user) {
            return res.status(404).send({ status: false, message: "User Not found" });
        }
        //============================== for password encryption ==============================================
        //comparing hard-coded password to the hashed password
        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) {
            return res.status(400).send({ status: false, message: "wrong password" })
        }
        //=================================== token creation ================================================
        let token = jwt.sign({ "userId": user._id }, "project/booksManagementGroup05", { expiresIn: '24h' });


        return res.status(200).send({ status: true, message: "login successfully", data: { userId: user._id, token: token } })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


//================================= getting userdetails ===================================================


const getUserData = async function (req, res) {
    try {
        let data = req.params.userId
        if (!data) return res.status(400).send({ status: false, msg: "user id is no present" })

        if (!mongoose.isValidObjectId(data)) return res.status(400).send({ status: false, msg: "userId is not valid" })

        let userData = await userModel.findOne({ _id: data })
        if (!userData) return res.status(404).send({ status: false, msg: "user data is not present" })


        return res.status(200).send({ status: true, message: "User profile details", Data: userData })
    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}


//=================================================================================================



const updateUser = async (req, res) => {
    try {
        const userId = req.params.userId
        const files = req.files
        var { fname, lname, email, phone, password, address } = req.body

        if (Object.keys(req.body).length == 0 && (!files || files.length == 0)) {
            return res.status(400).send({ status: false, message: "data required for profile updated" })
        }

        let userData = await userModel.findOne({ _id: userId })
        if (!userData) return res.status(404).send({ status: false, msg: "user data is not present" })

        let update = {}

        if (fname) {
            if (!validator.isValid(fname)) return res.status(400).send({ status: false, msg: "fname is not valid" })
            if (!validator.isValidName(fname)) return res.status(400).send({ status: false, msg: "fname is not valid" })
            update.fname = fname
        }
        if (lname) {
            if (!validator.isValid(lname)) return res.status(400).send({ status: false, msg: "lname is not valid" })
            if (!validator.isValidName(lname)) return res.status(400).send({ status: false, msg: "lname is not valid" })
            update.lname = lname
        }
        if (email) {
            if (!validator.isValid(email)) return res.status(400).send({ status: false, msg: "email is not valid" })
            if (!validator.isValidEmail(email)) {
                return res.status(400).send({ status: false, message: `Please fill valid or mandatory email ` })
            }
            let emailData = await userModel.findOne({ email: email })
            if (emailData) return res.status(409).send({ status: false, message: `email  is already present` })

            update.email = email

        }
        if (files.length > 0) {

            if (!files && files.length == 0) return res.status(400).send({ status: false, msg: "profileImage is mandatory" })
            let Image = await uploadFile(files[0])
            if (!validator.validImage(Image)) {
                return res.status(400).send({ status: false, msg: "profileImage is in incorrect format" })
            }
            update.profileImage = Image
        }

        if (phone) {
            if (!validator.isValid(phone)) return res.status(400).send({ status: false, msg: "phone is not valid" })
            if (!validator.isValidPhone(phone)) return res.status(400).send({ status: false, msg: "phone number is invalid , it should be starting with 6-9 and having 10 digits" })
            let phoneCheck = await userModel.findOne({ phone: phone })
            if (phoneCheck) return res.status(409).send({ status: false, msg: "phone number is already used" })
            update.phone = phone
        }

        if (password) {
            if (!validator.isValid(password)) return res.status(400).send({ status: false, msg: "password is not valid" })
            if (!validator.isValidPassword(password)) return res.status(400).send({ status: false, message: "password is invalid ,it should be of minimum 8 digits and maximum of 15 and should have atleast one special character and one number & one uppercase letter" })
            update.password = await bcrypt.hash(password, 10)
        }

        if (address) {

            try {
                address = JSON.parse(address)
            }
            catch (err) {
                return res.status(400).send({ status: false, message: "please provide adress in JSON object" })
            }
           
            if (address.shipping) {

                if (typeof address.shipping != "object") return res.status(400).send({ status: false, msg: "shipping should be object" })

                if (address.shipping.street) {

                    if (!validator.isValidName(address.shipping.street)) return res.status(400).send({ status: false, msg: "street name is not valid" })
                    update["address.shipping.street"] = address.shipping.street
                }
                if (address.shipping.city) {

                    if (!validator.isValidName(address.shipping.city)) return res.status(400).send({ status: false, msg: "city name is not valid" })
                    update["address.shipping.city"] = address.shipping.city
                }
                if (address.shipping.pincode) {
                    if (!validator.isValidPincode(address.shipping.pincode)) return res.status(400).send({ status: false, msg: "Pincode is not valid" })
                    update["address.shipping.pincode"] = address.shipping.pincode
                }
            }

            if (address.billing) {

                if (typeof address.billing != "object") return res.status(400).send({ status: false, msg: "billing should be object" })
                if (address.billing.street) {

                    if (!validator.isValidName(address.billing.street)) return res.status(400).send({ status: false, msg: "street name is not valid" })
                    update["address.billing.street"] = address.billing.street
                }
                if (address.billing.city) {

                    if (!validator.isValidName(address.billing.city)) return res.status(400).send({ status: false, msg: "city name is not valid" })
                    update["address.billing.city"] = address.billing.city
                }
                if (address.billing.pincode) {
                    if (!validator.isValidPincode(address.billing.pincode)) return res.status(400).send({ status: false, msg: "Pincode is not valid" })
                    update["address.billing.pincode"] = address.billing.pincode
                }
            }
        }

        let updateData = await userModel.findOneAndUpdate({ _id: userId }, update
            , { new: true })

        return res.status(200).send({ status: true, "message": "User profile updated", data: updateData })
    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}


module.exports = {createUser,getUserData,loginUser,updateUser}


module.exports = {createUser,getUserData,loginUser,updateUser}