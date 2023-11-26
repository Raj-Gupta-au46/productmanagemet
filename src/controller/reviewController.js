const { default: mongoose } = require("mongoose");
const productModel = require("../models/productModel");
const reviewSchema = require("../models/reviewModel");

createReview = async (req, res) => {
  try {
    const userId = req?.params?.userId;
    if (!mongoose.isValidObjectId(userId))
      return res
        .status(400)
        .send({ status: false, msg: "user id is not valid" });
    const { productId, message, rating } = req?.body;
    if (!message)
      return res
        .status(400)
        .send({ status: false, msg: "message is mandatory" });
    if (!rating)
      return res
        .status(400)
        .send({ status: false, msg: "message is mandatory" });

    if (!mongoose.isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, msg: "productid is not valid" });
    const product = await productModel.findById(productId);
    if (!product)
      return res
        .status(404)
        .send({ status: false, msg: "product is not found" });
    if (product.isDeleted)
      return res.status(400).send({ status: false, msg: "product is deleted" });

    const previousReview = await reviewSchema.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ["userId", { $toObjectId: userId }] },
              { $eq: ["productId", { $toObjectId: userId }] },
            ],
          },
        },
      },
    ]);
    if (!previousReview)
      res.status(400).send({ status: false, msg: "You already give review" });

    const data = await reviewSchema.create({
      userId,
      productId,
      rating,
      message,
    });

    res.status(201).send({ status: true, msg: "Successfully give the review" });
  } catch (error) {
    return res.status(500).send({ status: true, msg: error.message });
  }
};

updateReview = async (req, res) => {
  try {
    const reviewId = req?.body?.reviewId;
    const userId = req?.params?.userId;

    const review = await reviewSchema.findById(reviewId);
    if (!review)
      return res.status(404).send({ status: false, msg: "Review not found" });

    if (review.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .send({ status: false, msg: "Unauthorized to update this review" });
    }

    review.message = message || review.message;
    review.rating = rating || review.rating;
    await review.save();
    res.status(200).send({ status: true, msg: "Review updated successfully" });
  } catch (error) {
    return res.status(500).send({ status: false, msg: error.message });
  }
};

getReview = async (req, res) => {
  try {
    const productId = req?.params?.productId; // Assuming the productId is part of the URL parameters

    if (!mongoose.isValidObjectId(productId)) {
      return res
        .status(400)
        .send({ status: false, msg: "Product id is not valid" });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).send({ status: false, msg: "Product not found" });
    }

    const reviews = await reviewSchema.find({ productId });

    res.status(200).send({ status: true, reviews });
  } catch (error) {
    return res.status(500).send({ status: false, msg: error.message });
  }
};

deleteReview = async (req, res) => {
  try {
    const reviewId = req?.body?.reviewId;
    const userId = req?.params?.userId;
    if (!mongoose.isValidObjectId(reviewId)) {
      return res
        .status(400)
        .send({ status: false, msg: "Review id is not valid" });
    }

    const review = await reviewSchema.findById(reviewId);
    if (!review) {
      return res.status(404).send({ status: false, msg: "Review not found" });
    }

    // Check if the user is authorized to delete the review (assuming user ID is stored in the review document)
    if (review.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .send({ status: false, msg: "Unauthorized to delete this review" });
    }

    await review.remove();

    res.status(200).send({ status: true, msg: "Review deleted successfully" });
  } catch (error) {
    return res.status(500).send({ status: false, msg: error.message });
  }
};

module.export = { createReview, updateReview, getReview, deleteReview };
