import { Router } from "express";
import { loginUser, 
        logoutUser, 
        registerUser,
        refreshAccessToken,
        changeCurrentPassword,
        updateAccountDetails,
        updateUserAvatar,
        updateUserCover,
        getCurrentUser,
        getUserChannelProfile,
        getWatchHistory
     } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },{
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)
router.route("/settings/update-password").post(verifyJWT,changeCurrentPassword)
router.route("/settings/update-account-details").post(verifyJWT,updateAccountDetails)
router.route('/settings/update-avatar').patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route('/settings/update-coverImage').patch(verifyJWT, upload.single("coverImage"), updateUserCover)
router.route("/settings/get-account").get(verifyJWT,getCurrentUser)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)
export default router