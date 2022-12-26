const mongoose = require("mongoose")

const isValidBody = function (data) {
    return Object.keys(data).length > 0;
};

const isValidObjectId = (objectId) => {
    return mongoose.Types.ObjectId.isValid(objectId);
}

const isValid = function (value) {
    if (typeof value !== "string") return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
};

const validImage = function (image) {
    return /(\.jpg|\.jpeg|\.bmp|\.gif|\.PNG|\.png)$/.test(image)
}


let isValidName = function(name){
    let nameregex = /^[a-zA-Z\. ]*$/
    return nameregex.test(name)
}


let isValidEmail = function(email){
    let emailRegex=/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    return emailRegex.test(email)
}

let isValidPassword=function(password){
    let passwordRegex=/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/
    return passwordRegex.test(password)
}

let isValidPhone = (Mobile) => {
    return /^[6-9]\d{9}$/.test(Mobile)
};

let isValidPincode = (num) => {
    return /^[1-9]{1}[0-9]{2}\s{0,1}[0-9]{3}$/.test(num);
}


let isValidSize = (sizes) => {
    return ['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL'].includes(sizes);
}

let isValidNumber = (String) => {
    return /\d/.test(String)
}

let isValidStatus = (status) => {
    return ['pending', 'completed', 'cancelled'].includes(status);
}

let isValidPrice=(price)=>{
    return /\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})/.test(price)
}



module.exports={isValidPrice,isValid,isValidBody,isValidName,isValidEmail,isValidPassword,isValidObjectId,isValidPincode,isValidPhone,isValidSize,isValidNumber,isValidStatus,validImage}