import mongoose, { isValidObjectId } from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Unauthenticated User");
    }

    // Aggregate total video views and total videos
    const videoStats = await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId), isPublished: true } },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" },
                totalVideos: { $sum: 1 }
            }
        }
    ]);

    const stats = videoStats[0] || { totalViews: 0, totalVideos: 0 };

    // Count total subscribers
    const totalSubscribers = await Subscription.countDocuments({ channel: new mongoose.Types.ObjectId(userId) });

    // Aggregate total likes from the Like model
    const likeStats = await Like.aggregate([
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoData"
            }
        },
        {
            $unwind: "$videoData"
        },
        {
            $match: { "videoData.owner": `${userId}` }
        },
        {
            $group: {
                _id: null,
                totalLikes: { $sum: 1 }
            }
        }
    ]);

    const totalLikes = likeStats[0] ? likeStats[0].totalLikes : 0;

    // Construct the response object
    const channelStats = {
        totalViews: stats.totalViews,
        totalSubscribers: totalSubscribers,
        totalVideos: stats.totalVideos,
        totalLikes: totalLikes
    };

    return res.status(200).json(new ApiResponse(200, channelStats, "Channel stats fetched successfully"));
});


const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!isValidObjectId(userId)) throw new ApiError(400, "Unauthenticated User");

    const videos = await Video.aggregate([
        {
            $match: { owner: userId, isPublished: true }
        },
        {
            $project: {
                thumbnail: 1,
                title: 1,
                views: 1
            }
        }
    ]);

    if (videos.length === 0) throw new ApiError(400, "This channel has not posted any videos yet");

    return res.status(200).json(new ApiResponse(200, videos, "All videos of this channel are fetched successfully"));
});


export {
    getChannelStats, 
    getChannelVideos
    }