const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProduct,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controller/productController");
const {
  createUser,
  loginUser,
  getUserData,
  updateUser,
} = require("../controller/userController");
const {
  createCart,
  getCart,
  updateCart,
  deleteCart,
} = require("../controller/cartController");
const { createOrder, updateOrder } = require("../controller/orderController");
const { Authentication, authorization } = require("../middlewares/auth");
const {
  createReview,
  updateReview,
  getReview,
  deleteReview,
} = require("../controller/reviewController");

//=================================== user apis ===============================================

router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/user/:userId/profile", Authentication, authorization, getUserData);
router.put("/user/:userId/profile", Authentication, authorization, updateUser);

//================================== product apis ============================================

router.post("/products", createProduct);
router.get("/products", getProduct);
router.get("/products/:productId", getProductById);
router.put("/products/:productId", updateProduct);
router.delete("/products/:productId", deleteProduct);

//=================================== cart apis ==============================================

router.post("/users/:userId/cart", Authentication, authorization, createCart);
router.get("/users/:userId/cart", Authentication, authorization, getCart);
router.put("/users/:userId/cart", Authentication, authorization, updateCart);
router.delete("/users/:userId/cart", Authentication, authorization, deleteCart);

//========================================= order apis ========================================

router.post(
  "/users/:userId/orders",
  Authentication,
  authorization,
  createOrder
);
router.put("/users/:userId/orders", Authentication, authorization, updateOrder);

//========================================= review apis ========================================

router.post("/reviews/:userId/create", createReview);
router.put("/reviews/:userId/update", updateReview);
router.get("/reviews/:productId", getReview);
router.get("/reviews/:userId/delete", deleteReview);

module.exports = router;
