import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if(!name)throw new ApiError(400, "Unnamed Playlist cant be created")
    const playlist=await Playlist.create({
        name,
        description: description || "",
        owner:req.user?._id
    })
    if(!playlist) throw new ApiError(500,"Playlist cant be created due to some internal error")
    return res.status(200).json(new ApiResponse(200, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    const playlists=await Playlist.aggregate([{
        $match:{
            owner:userId
        }
    },{
        $project:{
            name:1,
            description:1,
            videos:1
        }
    }]
    )
    if(!playlists || playlists.length === 0)return res.status(200).json(new ApiResponse(200, null, "user doesnot have any playlist"))
        return res.status(200).json(new ApiResponse(200, playlists, "fetched user playlist successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }
    const playlist= await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    return res.status(200).json(new ApiResponse(200, playlist, "fetched playlist successfully"));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    // Check if the playlist exists
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Remove the video from the playlist's videos array
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $push: { videos: videoId } },
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully"));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // Validate playlist ID and video ID
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    // Check if the playlist exists
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Remove the video from the playlist's videos array
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: videoId } },
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId))throw new ApiError(400, "Invalid Playlist Id")
    await Playlist.findByIdAndDelete(playlistId)
    return res.status(200).json(new ApiResponse(200, null,"Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!isValidObjectId(playlistId))throw new ApiError(400, "Invalid Playlist Id")
    const playlist=Playlist.findByIdAndUpdate(playlistId,
    {
        name,
        description
    },{ new: true } 
)
    if(!playlist)throw new ApiError(400, "Playlist not found")
    return res.status(200).json(new ApiResponse(200, playlist,"Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}