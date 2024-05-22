import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {Tweet} from "../models/tweet.model.js"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Like } from "../models/like.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    try {
        const {videoId} = req.params
        if(!isValidObjectId(videoId))throw new ApiError(400, "Invalid Video ID")
        //TODO: toggle like on video
        //check if videoId is valid
        const video=await Video.findById(videoId)
        if(!video)throw new ApiError(400, "Video not found");
        //get current user id
        const user=req.user?._id
        if (!user) throw new ApiError(401, "User not authenticated");
        //likedby add / remove current user id 
        let hasuserLiked;
        const isAlreadyLiked = await Like.findOne({video:videoId, likedBy: user})
         if(isAlreadyLiked) {
            await Like.deleteOne({_id: isAlreadyLiked._id})
            hasuserLiked=false;
         }else{
            await Like.create({video: videoId, likedBy: user})
            hasuserLiked=true
         }
         const message = hasuserLiked ? "User Liked video Successfully": "User hasnot Liked  video Successfully"
    
         res.status(200).json(new ApiResponse(
            200,
            {hasuserLiked},
            message
        ));
    } catch (error) {
        res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, null, error.message));
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    try {
        const {commentId} = req.params
        if(!isValidObjectId(commentId))throw new ApiError(400, "Invalid comment ID")
        //TODO: toggle like on comment
        //check isCommentValid
        // check user id
        // toggle user like on comment
        const user= req.user?._id
        if(!user) throw new ApiError(403, "User not authenticated")
        const comment= await Comment.findById(commentId)
        if(!comment)throw ApiError (400, "Comment Doesnot exist")
        let likeComment;
        const isCommentLiked= await Like.findOne({comment:commentId, likedBy: user});
        if(isCommentLiked){
            await Like.deleteOne({_id:isCommentLiked._id})
            likeComment= false
        }else{
            await Like.create({comment:commentId, likedBy: user})
            likeComment=true
        }
    
        const message = likeComment ? "User Liked comment Successfully": "User hasnot Liked comment Successfully"
    
         res.status(200).json(new ApiResponse(
            200,
            {likeComment},
            message
        ));
    } catch (error) {
        res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, null, error.message));
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    try {
        const {tweetId} = req.params
        if(!isValidObjectId(tweetId))throw new ApiError(400, "Invalid Tweet ID")
        //TODO: toggle like on tweet
        //check if tweet is valid
        // check for userid
        //toggle user like
        const user= req.user?._id
        if(!user) throw new ApiError(403, " User not authenticated")
        const tweet= await Tweet.findById(tweetId)
        if(!tweet)throw ApiError (400, "Tweet Doesnot exist")
        const isTweetLiked= await Like.findOne({tweet:tweetId,likedBy:user})
        let likeTweet;
        if(isTweetLiked){
            await Like.deleteOne({_id: isTweetLiked._id})
            likeTweet=false;
        }else{
            await Like.create({tweet:tweetId, likedBy: user})
            likeTweet=true
        }
        const message = likeTweet ? "User Liked Tweet Successfully": "User hasnot Liked Tweet Successfully"
    
         res.status(200).json(new ApiResponse(
            200,
            {likeTweet},
            message
        ));
    } catch (error) {
        res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, null, error.message));
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
   try {
     //TODO: get all liked videos
     //Liked -> search for video likedBy with current user Id
     // for each video find owner user id
     //project video thumbnail, title, views, videoFile
     const videos = await Like.aggregate([
         {
             $match: {
                 likedBy: new mongoose.Types.ObjectId(req.user?.Id),
                 video: {
                     $exists: true
                 }
             }
         },
         {
             $lookup: {
                 from: "videos",
                 localField: "video",
                 foreignField: "_id",
                 as: "videos",
                 pipeline: [
                     {
                         $project: {
                             title: 1,
                             videoFile: 1,
                             thumbnail: 1,
                             views: 1,
                             owner: 1,
                         }
                     }
                 ]
             }
         },
         {
             $unwind: "$videos"
         },
         {
             $lookup: {
                 from: "users",
                 localField: "videos.owner",
                 foreignField: "_id",
                 as: "ownerDetails"
             }
         },
         {
             $unwind: "$ownerDetails"
         },
         {
             $addFields: {
                 "videos.owner.avatar": "$ownerDetails.avatar",
                 "videos.owner.username": "$ownerDetails.username"
             }
         },
         {
             $project: {
                 "videos.title": 1,
                 "videos.videoFile": 1,
                 "videos.thumbnail": 1,
                 "videos.views": 1,
                 "videos.owner.avatar": 1,
                 "videos.owner.username": 1
             }
         },
         {
             $replaceRoot: { newRoot: "$videos" }
         }
     ]);
     
     res.status(200).json(new ApiResponse(200,
         { videos, videoCount: videos.length },
         "Get Liked Videos Success"
     ));
   } catch (error) {
    res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, null, error.message));
   }
    
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}