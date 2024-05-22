import {app} from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config(); // No need to specify path if .env file is in the root directory

connectDB()
    .then(() => {
        const PORT = process.env.PORT || 8000; // Define PORT variable
        app.listen(PORT, () => {
            console.log(`Server is running at port: ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection failed:", err);
    });


/* First Approach
(async()=>{
try{
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
    app.on("error",()=>{
        console.log("ERR:",error);
        throw error;
    })
    app.listen(process.env.PORT,()=>{
        console.log(`App is listening on port ${process.env.PORT}`);
    })
}catch(error){
    console.error("Error:",error)
    throw error
}
})()
*/