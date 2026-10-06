require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
app.use(express.urlencoded({ extended: true }));

const memberSchema = new mongoose.Schema({
    memberId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    club: { type: String, required: true },
    year: { type: Number, required: true },
    role: { type: String, required: true },
    points: { type: Number, required: true },
    interests: [String],
    status: { type: String, required: true }
});

const Member = mongoose.model("ClubMember", memberSchema);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

function show(res, title, data) {
    res.send(`<h2>${title}</h2><pre>${JSON.stringify(data, null, 2)}</pre><a href="/">Back</a>`);
}

app.post("/members/add", async (req, res) => {
    try {
        await Member.create({
            ...req.body,
            year: Number(req.body.year),
            points: Number(req.body.points),
            interests: (req.body.interests || "").split(",").map(x => x.trim()).filter(Boolean)
        });
        show(res, "Member added successfully", { memberId: req.body.memberId });
    } catch (e) {
        res.status(400).send("Could not add member. Check the Member ID is unique. " + e.message);
    }
});

app.post("/members/search", async (req, res) => {
    const data = await Member.find({
        club: req.body.club,
        points: { $gt: Number(req.body.points) }
    });
    show(res, "Members matching club and points", data);
});

app.post("/members/find", async (req, res) => {
    const data = await Member.findOne({ memberId: req.body.memberId });
    show(res, "Member search result", data);
});

app.post("/members/project", async (req, res) => {
    const data = await Member.find({}, {
        _id: 0, name: 1, club: 1, role: 1, points: 1
    });
    show(res, "Selected member details", data);
});

app.post("/members/update", async (req, res) => {
    const data = await Member.updateOne(
        { memberId: req.body.memberId },
        { $set: { role: req.body.role, points: Number(req.body.points) } }
    );
    show(res, "Member updated", data);
});

app.post("/members/increase", async (req, res) => {
    const data = await Member.updateMany(
        { club: req.body.club },
        { $inc: { points: Number(req.body.points) } }
    );
    show(res, "Club points increased", data);
});

app.post("/members/range", async (req, res) => {
    const data = await Member.find({
        points: {
            $gte: Number(req.body.min),
            $lte: Number(req.body.max)
        }
    });
    show(res, "Members in points range", data);
});

app.post("/members/delete", async (req, res) => {
    const data = await Member.deleteOne({ memberId: req.body.memberId });
    show(res, "Delete result", data);
});

app.post("/members/all", async (req, res) => {
    const data = await Member.find().sort({ points: -1 });
    show(res, "All members sorted by points descending", data);
});

async function start() {
    await mongoose.connect(process.env.MONGO_URI);

    if (await Member.countDocuments() === 0) {
        await Member.insertMany([
            { memberId: "M101", name: "Arun", club: "Coding Club", year: 2, role: "Member", points: 50, interests: ["Coding"], status: "Active" },
            { memberId: "M102", name: "Priya", club: "Music Club", year: 3, role: "Lead", points: 80, interests: ["Singing"], status: "Active" },
            { memberId: "M103", name: "Rahul", club: "Coding Club", year: 1, role: "Member", points: 70, interests: ["Web Development"], status: "Active" },
            { memberId: "M104", name: "Meena", club: "Sports Club", year: 4, role: "Coordinator", points: 90, interests: ["Badminton"], status: "Active" }
        ]);
    }

    console.log("MongoDB connected");
    app.listen(3000, () => console.log("Server running on port 3000"));
}

start().catch(console.error);