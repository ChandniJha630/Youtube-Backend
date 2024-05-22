import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";

const connectDB =async()=>{
    try{
        const connInstance= await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\n MongoDB connected || DB Host:${connInstance.connection.host} `)
        // console.log("a==5, b!=6,c===8, f>=9, e<=10, m=>n")
    }catch(error){
        console.error(" MONGODB connection Error:",error)
        process.exit(1)
    }
}
export default connectDB