import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video comment requested");

    const skip = (page - 1) * limit;

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
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
                            username: 1,
                            fullname: 1,
                            avatar: 1,
                            content: 1
                        }
                    }
                ]
            }
        },
        { $skip: skip },
        { $limit: parseInt(limit) }
    ]);

    if (!comments) {
        throw new ApiError(400, "Comments Not Found");
    }

    return res.status(200).json(new ApiResponse(200, comments, "comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    try {
        const {videoId,content}=req.params
        
        const userId=req.user?._id
        if(!userId) throw new ApiError(400,"User isnot Authenticated")
        if(!isValidObjectId(videoId)) throw new ApiError("Video Doesnot Exist and comment cant be added")
        const video=await Video.findById(videoId)
        if(!video) throw new ApiError(400, "Media Doesnot Exist and comment cant be added")
        const comment=await Comment.create({content: content.trim(), owner: userId, video: video._id})
        res.status(200).json(new ApiResponse(200,{comment},"Comment added successfully"))
    } catch (error) {
        res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, null, error.message));
    }
})

const updateComment = asyncHandler(async (req, res) => {
    try {
        
        const {content,commentId}=req.params
        const userId=req.user?._id
        if(!userId) throw new ApiError(400,"User isnot Authenticated")
        if(!isValidObjectId(commentId)) throw new ApiError("Media Doesnot Exist and comment cant be added")
        const comment=await Comment.findOne({_id:commentId , owner:userId})
        if(!comment)throw new ApiError(400,"Comment cant be updated")
        comment.content = content;
        await comment.save();
        res.status(200).json(new ApiResponse(200,{comment},"Comment updated successfully"))
    } catch (error) {
        res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, null, error.message));
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    try {
        const {commentId}= req.params
        if(!isValidObjectId(commentId))throw new ApiError (400, "Commment doesnot exist");
        const userId=req.user?._id
        if(!userId) throw new ApiError(400,"User isnot Authenticated")
        const comment= await Comment.findOne({_id:commentId, owner:userId})
        if(!comment) throw new ApiError(400, "You dont have access to delete this comment");
        await Comment.deleteOne({_id:commentId, owner:req.user?._id})
        res.status(200).json(new ApiResponse(200,null,"Comment deleted successfully"))
    } catch (error) {
        res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, null, error.message));
    }
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }