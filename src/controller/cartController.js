const { default: mongoose } = require('mongoose');
const cartModel = require('../models/cartModel');
const userModel = require('../models/userModel')
const productModel = require('../models/productModel');
const validator = require("../Validators/validation");



createCart = async (req, res) => {
    try {
        const userId = req.params.userId
        if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, msg: "user id is not valid" })

        const userExist = await userModel.findById(userId)
        if (!userExist) return res.status(404).send({ status: false, msg: "user is not Exist" })

        const { productId, cartId } = req.body

        if (!mongoose.isValidObjectId(productId)) return res.status(400).send({ status: false, msg: "productid is not valid" })
        const product = await productModel.findById(productId)
        if (!product) return res.status(404).send({ status: false, msg: "product is not found" })
        if (product.isDeleted) return res.status(400).send({ status: false, msg: "product is deleted" })

        const priviousCart = await cartModel.findOne({ userId: userId })
        if (priviousCart && !cartId) return res.status(200).send({ status: true, msg: "card is already exist--enter cardId" })
        if (priviousCart) {
            if (!mongoose.isValidObjectId(cartId)) return res.status(400).send({ status: false, msg: "cartId is not valid" })
            const cart = await cartModel.findById(cartId)
            if (!cart) return res.status(404).send({ status: false, msg: "cart is not found" })
            if (cart.userId != userId) return res.status(403).send({ status: false, msg: "unauthorized...." })


            const found = priviousCart.items.find(x => x.productId == productId)
            if (found) {
                priviousCart.items[priviousCart.items.indexOf(found)].quantity = priviousCart.items[priviousCart.items.indexOf(found)].quantity + 1
                priviousCart.totalPrice = priviousCart.totalPrice + product.price
                const cardData = await cartModel.findOneAndUpdate({ userId }, priviousCart, { new: true })
                return res.status(200).send({ status: true, msg: "card is created", data: cardData })
            }

            priviousCart.totalItems = priviousCart.items + 1
            priviousCart.totalPrice = priviousCart.totalPrice + product.price
            priviousCart.items.push({ productId: productId, quantity: 1 })
            priviousCart.totalItems = priviousCart.items.length

            const cardData = await cartModel.findOneAndUpdate({ userId }, priviousCart, { new: true })
            return res.status(200).send({ status: true, msg: "card is created", data: cardData })
        }

        const update = {
            userId: userId,
            items: {
                productId: productId,
                quantity: 1
            },
            totalPrice: product.price,
            totalItems: 1
        }

        if (!priviousCart) {
            const cardData = await cartModel.create(update)
            return res.status(201).send({ status: true, msg: "card is created", data: cardData })
        }
    }
    catch (err) {
        return res.status(500).send({ status: true, msg: err.message })
    }
}




//======================================getcart==============================================


const getCart = async function (req, res) {
    try {
        let userId = req.params.userId
        //============================= checking the userid format =====================================
        if (!validator.isValidObjectId(userId)) return res.status(400).send({ status: false, message: "invalid UserId" })
        //===================== getting list of items in cart ====================================
        let checkCart = await cartModel.findOne({ userId: userId }).populate({ path: "items.productId", select: { price: 1, title: 1, productImage: 1, _id: 0 } })
        if (!checkCart) return res.status(404).send({ status: false, message: "Cart not exist for this userId" })
        //============================= fetching data ==============================================
        return res.status(200).send({ status: true, message: "Success", data: checkCart })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}



//================================== updating the cart ========================================

const updateCart = async function (req, res) {
    try {
        let userId = req.params.userId
        let body = req.body
        let { cartId, productId, removeProduct } = body

        //========================================== if body is missing ==============================
        if (!validator.isValidBody(body))
            return res.status(400).send({ status: false, message: "Body cannot be empty" });

        //=========================== only 2 keys should be entered in body ============================
        if (!(cartId || removeProduct || productId)) {
            return res.status(400).send({ status: false, message: "enter valid keys to update cart i.e cartId,removeProduct,productId" })
        }

        //====================================== cart exist or not ==================================
        let cartExist = await cartModel.findOne({ userId: userId })
        if (!cartExist) {
            return res.status(404).send({ status: false, message: `No cart found` });
        }

        //======================================== cartId Validation ==================================
        if (cartId) {
            if (!validator.isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, message: "Please provide valid cart Id" });
            }
            if (cartExist._id.toString() != body.cartId) {
                return res.status(403).send({ status: false, message: `this cart belong to different user` });
            }
        }

        //==================================== if product  id is present =============================
        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Please provide valid product Id" });
        }
        let findProduct = await productModel.findById(body.productId)
        if (!findProduct) {
            return res.status(404).send({ status: false, message: `No product found with this id` });
        }
        if (findProduct.isDeleted) return res.status(400).send({ status: false, msg: "product is already deleted" })



        let productArr = cartExist.items.filter(x =>
            x.productId.toString() == body.productId) // will return an array 

        if (productArr.length == 0) {
            return res.status(404).send({ status: false, message: "product is not present in the cart" })
        }
        let indexNumber = cartExist.items.indexOf(productArr[0]) // return index no of productArr

        //============================ if removeProduct is present ===================================
        if (validator.isValidNumber(removeProduct)) {
            if (!(removeProduct == 0 || removeProduct == 1)) {
                return res.status(400).send({ status: false, message: "removeProduct can either be 0 or 1" })
            }
            if (removeProduct == 0) {
                cartExist.totalPrice = (cartExist.totalPrice - (findProduct.price * cartExist.items[indexNumber].quantity)).toFixed(2) //to fixed is used to fix the decimal value to absolute value/or rounded value
                cartExist.items.splice(indexNumber, 1)
                cartExist.totalItems = cartExist.items.length
                await cartExist.save()
                await cartExist.populate({ path: "items.productId", select: { price: 1, title: 1, productImage: 1, _id: 0 } })
            }
            if (removeProduct == 1) {
                cartExist.items[indexNumber].quantity -= 1;
                cartExist.totalPrice = (cartExist.totalPrice - findProduct.price).toFixed(2)
                if (cartExist.items[indexNumber].quantity == 0) {
                    cartExist.items.splice(indexNumber, 1)
                }
                cartExist.totalItems = cartExist.items.length
                await cartExist.save()
                await cartExist.populate({ path: "items.productId", select: { price: 1, title: 1, productImage: 1, _id: 0 } })
            }
        }
        return res.status(200).send({ status: true, message: "Successfully updated", data: cartExist })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}



//=====================================deletecart=========================================

const deleteCart = async function (req, res) {

    try {
        let id = req.params.userId
        if (!validator.isValidObjectId(id)) {
            return res.status.send({ status: false, message: "Please provide valid Object id" })
        }
        let user = await userModel.findById(id)
        if (!user) {
            return res.status(404).send({ status: false, message: "User with this user id does not exist" })
        }

        const cartIs = await cartModel.findOne({userId:id})
        if (!cartIs) return res.status(404).send({ status: false, msg: "cart not present" })
        if (cartIs.items.length == 0) return res.status(404).send({ status: false, msg: "cart item is already deleted" })
       
          const emptied= await cartModel.findOneAndUpdate({ userId: id },
            { $set: { items: [], totalItems: 0, totalPrice: 0 } },{new:true})

        return res.status(200).send({ status: true, message: "Cart deleted successfuly",emptied:emptied})


    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}




module.exports ={ createCart , getCart , updateCart , deleteCart}