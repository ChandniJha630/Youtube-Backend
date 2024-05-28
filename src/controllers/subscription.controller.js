import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId=req.user?._id
    // TODO: toggle subscription
    if(!isValidObjectId(channelId))throw new ApiError(400, "Channel is invalid")
    if(!isValidObjectId(userId))throw new ApiError(400, "User is invalid")
    const subscription= await Subscription.findOne({subscriber:userId,channel:channelId})
    if(!subscription){
        const subscriber= Subscription.create({subscriber:userId,channel:channelId})
        return res.status(200).json(new ApiResponse(200, subscriber, "subscriber added"))
    }else{
        await Subscription.findByIdAndDelete(subscription._id);
        return res.status(200).json(new ApiResponse(200, subscriber, "subscriber removed"))
    }

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)) throw new ApiError(400, "channel id is required")
    const channelSubscribers = await Subscription.aggregate([
        {$match:{channel: new mongoose.Types.ObjectId(`${channelId}`)}},
        {
            $lookup:{
                from:"users",
                localField: "subscriber",
                foreignField:"_id",
                as: "subscriber",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullname:1,
                            avatar:1
                        }
                    }
                ]
            }
        },{
            $facet: {
                subscribers: [
                    {
                        $project: {
                            subscriber: 1,
                            createdAt: 1
                        }
                    }
                ],
                count: [
                    {
                        $count: "totalSubscribers"
                    }
                ]
            }
        }
    ])
    const subscribers = channelSubscribers[0].subscribers;
    const count = channelSubscribers[0].count[0] ? channelSubscribers[0].count[0].totalSubscribers : 0;
    
    return res.status(200).json(new ApiResponse(200, { subscribers, count }, "Channel subscribers fetched successfully"));
    })

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!isValidObjectId(subscriberId))throw new ApiError(400, "Subscriber is required")
    const subscribedChannels= await Subscription.aggregate([{
        $match: {subscriber: new mongoose.Types.ObjectId(`$(subscriberId)`)}
    },
        {
            $lookup:{
                from: "users",
                localField:"channel",
                foreignField:"_id",
                as:"channel",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullname:1,
                            avatar:1
                        }
                    }
                ]
            }
        },{
            $facet: {
                channels: [
                    {
                        $project: {
                            channel: 1,
                            createdAt: 1
                        }
                    }
                ],
                count: [
                    {
                        $count: "totalSubscribedChannels"
                    }
                ]
            }
        }
    ])
    const channels=subscribedChannels[0].channels
    const count= subscribedChannels[0].count[0] ? subscribedChannels[0].count[0].totalSubsribedChannels:0
    return res.status(200).json(new ApiResponse(200, {channels,count}, "subscribed channels fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}