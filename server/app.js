import express from 'express';
import { config } from './resources/config.js';
import { initializeApp } from "firebase/app";

const firebaseConfig = {
    apiKey: config.apiKey,
    authDomain: "spoilscanner.firebaseapp.com",
    databaseURL: "https://spoilscanner-default-rtdb.firebaseio.com",
    projectId: "spoilscanner",
    storageBucket: "spoilscanner.appspot.com",
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
    measurementId: config.measurementId
};

// Initialize Firebase
const fireApp = initializeApp(firebaseConfig);

const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
})