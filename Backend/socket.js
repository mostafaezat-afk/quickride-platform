const moment = require("moment-timezone");
const { Server } = require("socket.io");
const userModel = require("./models/user.model");
const rideModel = require("./models/ride.model");
const captainModel = require("./models/captain.model");
const frontendLogModel = require("./models/frontend-log.model");

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    if (process.env.ENVIRONMENT == "production") {
      socket.on("log", async (log) => {
        log.formattedTimestamp = moment().tz("Asia/Kolkata").format("MMM DD hh:mm:ss A");
        try {
          await frontendLogModel.create(log);
        } catch (error) {
          console.log("Error sending logs...");
        }
      });
    }

    socket.on("join", async (data) => {
      const { userId, userType } = data;
      console.log(userType + " connected: " + userId);
      if (userType === "user") {
        await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
      } else if (userType === "captain") {
        await captainModel.findByIdAndUpdate(userId, { socketId: socket.id });
      }
    });

    socket.on("update-location-captain", async (data) => {
      const { userId, location } = data;

      if (!location || !location.ltd || !location.lng) {
        return socket.emit("error", { message: "Invalid location data" });
      }
      await captainModel.findByIdAndUpdate(userId, {
        location: {
          type: "Point",
          coordinates: [location.lng, location.ltd],
        },
      });
    });

    socket.on("update-location-user", async (data) => {
      const { userId, location, vehicleType } = data;
      if (!location || !location.ltd || !location.lng) return;

      try {
        const mapService = require("./services/map.service");
        const radius = 10; // 10 km radius for radar
        const captains = await mapService.getCaptainsInTheRadius(
          location.ltd,
          location.lng,
          radius,
          vehicleType
        );

        // Optional: filter out inactive captains if needed, but the model status might cover it
        socket.emit("nearby-captains", captains);
      } catch (error) {
        console.error("Error fetching nearby captains:", error);
      }
    });

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`${socket.id} joined room: ${roomId}`);
    });

    socket.on("message", async ({ rideId, msg, userType, time }) => {
      const date = moment().tz("Asia/Kolkata").format("MMM DD");
      socket.to(rideId).emit("receiveMessage", { msg, by: userType, time });
      try {
        const ride = await rideModel.findOne({ _id: rideId });
        ride.messages.push({
          msg: msg,
          by: userType,
          time: time,
          date: date,
          timestamp: new Date(),
        });
        await ride.save();
      } catch (error) {
        console.log("Error saving message: ", error);
      }
    });

    socket.on("disconnect", async () => {
      console.log(`Client disconnected: ${socket.id}`);
      try {
        await userModel.findOneAndUpdate(
          { socketId: socket.id },
          { socketId: null }
        );
        await captainModel.findOneAndUpdate(
          { socketId: socket.id },
          { socketId: null }
        );
      } catch (err) {
        console.error("Error clearing socketId on disconnect:", err);
      }
    });
  });
}

const sendMessageToSocketId = (socketId, messageObject) => {
  if (io) {
    if (io.sockets.sockets.has(socketId)) {
      console.log("message sent to: ", socketId);
      io.to(socketId).emit(messageObject.event, messageObject.data);
      return true;
    } else {
      console.log("Socket not connected: ", socketId);
      return false;
    }
  } else {
    console.log("Socket.io not initialized.");
    return false;
  }
};

module.exports = { initializeSocket, sendMessageToSocketId };
