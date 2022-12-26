const validator = require("../Validators/validation");
const cartModel = require("../models/cartModel");
const orderModel = require("../models/orderModel");


//============================= creating an order ================================================

const createOrder = async function (req, res) {
    try {
        let userId = req.params.userId;
        let data = req.body;
        let { cartId, status, cancellable } = data;

        if (!validator.isValid(userId)) {
            return res.status(400).send({ status: false, message: "User ID is missing" });
        }

        //========================= if body is empty ============================================
        if (!validator.isValidBody(data))
            return res.status(400).send({ status: false, message: "Body cannot be empty" });

        //=============================== cartid validation =====================================
        if (!cartId) {
            return res.status(400).send({ status: false, message: "Cart ID is mandatory" });
        }
        if (!validator.isValid(cartId)) {
            return res.status(400).send({ status: false, message: "Cart ID is missing" });
        }
        if (!validator.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "Please provide valid format of cart Id" });
        }
        //============================ checking if the cart exist from the userid ======================  
        let findingCart = await cartModel.findOne({ userId: userId });
        if (!findingCart)
            return res.status(404).send({ status: false, message: `No cart exist for ${userId}` });
        //========================= if cart exist but cart is empty ======================================
        if (findingCart.items.length === 0)
            return res.status(400).send({ status: false, message: "Cart is empty" });

        //============================= if status is present in body ==============================
        if (status || typeof status == "string") {
            if (!validator.isValid(status)) {
                return res.status(400).send({ status: false, message: " Please provide status" })
            }
            if (!validator.isValidStatus(status))
                return res.status(400).send({ status: false, message: "Status should be 'pending', 'completed', 'cancelled'" });
            if (status == 'cancelled'|| status == "completed") {
                return res.status(400).send({ status: false, message: "status cannot be cancelled or completed prior to creating an order" })
            }
        }
        //=============================== if cancelleable is present in body =========================
        if (cancellable) {
            if (!validator.isValid(cancellable))
                return res.status(400).send({ status: false, message: "cancellable should not contain blank spaces" });
            if (typeof cancellable == 'string') {
                cancellable = cancellable.toLowerCase().trim();
                if (cancellable == 'true' || cancellable == 'false') {
                    cancellable = JSON.parse(cancellable)
                } else {
                    return res.status(400).send({ status: false, message: "Please enter 'true' or 'false'" });
                }
            }
        }

        let totalQuantity = 0;
        for (let i = 0; i < findingCart.items.length; i++) {
            totalQuantity += findingCart.items[i].quantity;
        }


        data.userId = userId;
        data.items = findingCart.items;
        data.totalPrice = findingCart.totalPrice;
        data.totalItems = findingCart.totalItems;
        data.totalQuantity = totalQuantity;

        let result = await orderModel.create(data);
        let cartUpdation = await cartModel.updateOne({ _id: findingCart._id }, { items: [], totalPrice: 0, totalItems: 0 });

        return res.status(201).send({ status: true, message: "Success", data: result })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}





//=================================== updating an order status ==========================================

const updateOrder = async function (req, res) {
    try {
        let userId = req.params.userId;
        let data = req.body;
        let { orderId, status } = data;
        //============================ validation for userid ============================================
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Please provide valid user Id" });
        }
        if (!validator.isValid(userId)) {
            return res.status(400).send({ status: false, message: "User ID is missing" });
        }

        let findCart = await cartModel.findOne({ userId: userId });
        if (!findCart)
            return res.status(404).send({ status: false, message: `No cart exist for ${userId}` });


        //============================== if body is empty ===============================================
        if (!validator.isValidBody(data))
            return res.status(400).send({ status: false, message: "Body cannot be empty" });
        //=========================== if valid keys are not entered in body =============================    
        if (data) {
            if (!(orderId || status)) {
                return res.status(400).send({ status: false, message: "enter valid keys to update order" })
            }
        }
        //================================ validation for orderid ============================================
        if (!orderId)
            return res.status(400).send({ status: false, message: "order ID is required" });
        if (!validator.isValid(orderId)) {
            return res.status(400).send({ status: false, message: "order ID is empty please enter orderid" });
        }
        if (!validator.isValidObjectId(orderId)) {
            return res.status(400).send({ status: false, message: "Please provide valid order Id" });
        }

        //============================== validation for status ===============================================
        if (status) {
            if (!validator.isValidStatus(status))
                return res.status(400).send({ status: false, message: "Status should be one of 'pending', 'completed', 'cancelled'" });
        }
        //================================== checking data if it is cancellable or not ========================
        let findOrder = await orderModel.findById({ _id: orderId })
        if (!findOrder) {
            return res.status(404).send({ status: false, message: "No order found" })
        }
        if (findOrder.isDeleted == true) {
            return res.status(404).send({ status: false, message: "order is aready deleted" })
        }
        //============================ if order status is completed =================================
        if (findOrder.status === "completed") {
            return res.status(400).send({ status: false, message: "Cannot cancel completed order" })
        }
        //============================== if order is already cancelled ================================
        if (findOrder.status === "cancelled") {
            return res.status(400).send({ status: false, message: "Order is already cancleled" })
        }

        let newStatus = {}
        if (status == "cancelled" || status == "completed") {
            //========================= if order is not cancellable ====================================
            if (findOrder.cancellable == false && status == 'cancelled') {
                return res.status(400).send({ status: false, message: "this order is not cancellable" })
            } 
            if(status == "cancelled") {
                return res.status(200).send({ status: true, message: "The order is cancelled" })
            }else {
                newStatus.status = status
            }
        }

        //======================================== status updation =============================================
        let updateOrder = await orderModel.findByIdAndUpdate({ _id: findOrder._id }, newStatus, { new: true })

        return res.status(200).send({ status: true, message: "Success", data: updateOrder })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}




module.exports = { createOrder, updateOrder }