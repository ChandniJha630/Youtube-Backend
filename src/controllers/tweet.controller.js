import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    try {
        // Get tweet content from request body
        const { tweet } = req.body;

        // Validate that tweet content is provided
        if (!tweet) {
            throw new ApiError(400, "Tweet content is missing");
        }

        // Get the creator's user ID from the request
        const creator = req.user?._id;

        // Create a new tweet
        const newTweet = await Tweet.create({ content: tweet.trim(), owner: creator });

        // Determine success message
        const message = newTweet ? "New Tweet created successfully" : "There was some error while creating new tweet";

        // Respond with the new tweet and success message
        res.status(200).json(new ApiResponse(200, {newTweet}, message));
    } catch (error) {
        // Handle any errors that occur and respond with appropriate status code and message
        res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, null, error.message));
    }
});


const getUserTweets = asyncHandler(async (req, res) => {
    try {
        // Get username from request body
        const { username } = req.body;

        // Validate that username is provided
        if (!username) {
            throw new ApiError(400, "Username is required");
        }

        // Find user ID from username
        const user = await User.findOne({ username });
        
        // Check if the user exists
        if (!user) {
            throw new ApiError(400, "This username does not exist");
        }

        // Aggregate all tweets with owner = userId
        const tweets = await Tweet.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(user._id)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                fullname: 1,
                                username: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: { $arrayElemAt: ["$owner", 0] }
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            }
        ]);

        // Respond with the aggregated tweets
        res.status(200).json(new ApiResponse(200, {tweets}, "Tweets aggregated successfully"));
    } catch (error) {
        // Handle any errors that occur
        res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, null, error.message));
    }
});

const updateTweet = asyncHandler(async (req, res) => {
    try {
        //TODO: update tweet
        const {tweetId,text}=req.body
        if(!isValidObjectId(tweetId))throw new ApiError(400, "Which Tweet You want to update isnot mentioned clearly")
        if(! text)throw new ApiError(400, "Please give updated content for tweet")
        const tweet= await Tweet.findByIdAndUpdate(
            {_id: tweetId, owner: req.user?._id},
            {
                $set: {
                    content: text.trim()
                },
            }, 
            { new: true }
        )
        const message= tweet? "Tweet Updated Successfully":" There was some problem while updating tweet"
    
        res.status(200).json(new ApiResponse(200,{tweet},message))
    } catch (error) {
        res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, null, error.message));
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    try {
        //TODO: delete tweet
        const {tweetId}=req.body
        if(!isValidObjectId(tweetId)) throw new ApiError(400, "Tweet doesnot exist")
        const tweet= await Tweet.findById(tweetId)
        if(!tweet) throw new ApiError(400, "Tweet doesnot exist")
        if(!tweet.owner.equals(req.user._id)) throw new ApiError(403, "You do not have permission to delete this tweet");
        await Tweet.deleteOne({_id: tweetId})
        res.status(200).json(new ApiResponse(200,null, "Tweet deleted successfully"))
    } catch (error) {
        res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, null, error.message));
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}