import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    let sortCriteria = {}
    let videoQuery = {}
    if(!isValidObjectId(userId))throw ApiError(400, "User isnot authenticated");
    videoQuery.userId=userId
    if(query){
        videoQuery.$or=[
            {title:{$regex:query, $options:'i'}},
            { description: { $regex: query, $options: 'i' } }
        ]
    }
    if(sortBy && sortType){
        sortCriteria[sortBy]=sortType ==="desc"?-1:1;
    }
    const videos= await videoQuery.find(videoQuery)
                                .sort(sortCriteria)
                                .skip((page-1)*limit)
                                .limit(limit)
    if(!videos)throw new ApiError(400, "error while featching all videos")
    return res.status(200).json(new ApiResponse(200, videos, "videos featched successfully"));
    })

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    const videoFilePath = req.files?.videoFile[0]?.path;
    const thumbnailfilePath= req.files?.thumbnail[0]?.path;
    if(!title)throw new ApiError(400, "Title is missing");
    if(!videoFilePath)throw new ApiError(400, "Video is missing")
    if(!thumbnailfilePath)throw new ApiError(400, "Thumbnail is missing")
    const uploadedThumbnail= await uploadOnCloudinary(thumbnailfilePath);
    const uploadedVideo=await uploadOnCloudinary(videoFilePath)

    if(!uploadedThumbnail)throw new ApiError(500, "Error while uploading Thumbnail");
    if(!uploadedVideo)throw new ApiError(500, "Error while uploading video");
    const video = await Video.create({
        title,
        description: description || "",
        thumbnail: uploadedThumbnail.url,
        videoFile:uploadedVideo.url,
        duration:uploadedVideo.duration,
        owner: req.user?._id

    })
    return res.status(200).json(new ApiResponse(200, video, "video uploaded successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Find the video by ID and increment the views count by 1
    const video = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } }, // Increment the views field by 1
        { new: true } // Return the updated document
    );

    if (!video) {
        throw new ApiError(404, "Video does not exist");
    }

    return res.status(200).json(new ApiResponse(200, video, "Video found and sent successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description}=req.body
    const thumbnailLocalPath= req.file?.path
    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video Id")
    if (!title && !description) {
            throw new ApiError(400,"title and description are required")
        }
    if(!thumbnailLocalPath){
            throw new ApiError(400,"thumbnail file is missing")
        }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if(!thumbnail){
        throw new ApiError(400,"thumbnail upload failed")
    }
    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title,
                description,
                thumbnail:thumbnail.url
            }
    },
    {
        new:true
    })
    if(!video){
        throw new ApiError(500, "error while updating the video")
    }
    return res.status(200).json(new ApiResponse(200, video, "video updated successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video Id")
    const video = await Video.findById(videoId)
    if(!video) throw new ApiError(400, "Video doesnot exist")
    await Video.findByIdAndDelete(videoId)
    return res.status(200).json(new ApiResponse(200,{},"video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video Id")
    const video= await Video.findById(videoId)
    video.isPublished = !video.isPublished
    await video.save()
    return res.status(200).json(new ApiResponse(200, video, "published status is updated"))
    })

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}