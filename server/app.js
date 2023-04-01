import express from 'express';
import { config } from './resources/config.js';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import vision from '@google-cloud/vision';
import fs from 'fs';

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
const provider = new GoogleAuthProvider();

const auth = getAuth();
signInWithPopup(auth, provider)
    .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        // The signed-in user info.
        const user = result.user;
        // IdP data available using getAdditionalUserInfo(result)
        // ...
    }).catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
    });

const app = express();
const port = 3000;

// Parsing food expiration data file
let food_data = JSON.parse(fs.readFileSync('./resources/food_keeper_data.json'));

// Product info index
const product_sheet_index = 2;
const product_name_index = 2;

const product_pantry_max_date_index = 10;
const product_pantry_max_date_metric_index = 11;

const product_refrigerate_max_date_index = 21;
const product_refrigerate_max_date_metric_index = 22;
const product_refrigerate_tip_index = 23

const refrigerate_after_opening_max_date_index = 24;
const refrigerate_after_opening_max_date_metric_index = 25;

let list_of_products = food_data['sheets'][product_sheet_index]['data'];

app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.get('/getItemExp/:item_name', (req, res) => {
    const item_name = req.params.item_name;
    let selectedItem = 0;
    for (var i = 0; i < list_of_products.length; i++) {
        if (food_data['sheets'][product_sheet_index]['data'][i][product_name_index]['Name'].toLowerCase() == item_name.toLowerCase()) {
            console.log(food_data['sheets'][product_sheet_index]['data'][i][product_name_index]);
            console.log(food_data['sheets'][product_sheet_index]['data'][i][product_pantry_max_date_index]);
            console.log(food_data['sheets'][product_sheet_index]['data'][i][product_pantry_max_date_metric_index]);
            console.log(food_data['sheets'][product_sheet_index]['data'][i][product_refrigerate_max_date_index]);
            console.log(food_data['sheets'][product_sheet_index]['data'][i][product_refrigerate_max_date_metric_index]);
            console.log(food_data['sheets'][product_sheet_index]['data'][i][refrigerate_after_opening_max_date_index]);
            console.log(food_data['sheets'][product_sheet_index]['data'][i][refrigerate_after_opening_max_date_metric_index]);
            selectedItem = i;
        }
    }
    res.send(JSON.stringify(food_data['sheets'][product_sheet_index]['data'][selectedItem]));
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
})

// Call quickstart method to scan receipt and return json of items on receipt
async function quickstart() {
    // Creates a client
    const client = new vision.ImageAnnotatorClient();
    const [result] = await client.textDetection("./resources/receipt3.png");
    const detections = result.textAnnotations;
    const forms = regexMachine(detections[0].description);
    let items = await walmartAPICall(forms);
    console.log(items);
}
quickstart();

function regexMachine(receiptText) {
    const stNumberRegex = /ST#\s+(\d+)/;
    const storeId = receiptText.match(stNumberRegex)[1];
    //console.log(stNumber)

    const dateRegex = /\b(\d{2}\/\d{2}\/\d{2})\b/;
    const date = receiptText.match(dateRegex)[1];
    const purchaseDate = date.replace(/^(\d{2})\/(\d{2})\/(\d{2})$/, '$1-$2-20$3');
    //console.log(date)

    //let cardNumber = receiptText.slice(receiptText.indexOf("***** **** **** ")+16, receiptText.indexOf("***** **** ****")+20)
    const cardNumberRegex = /(?<=\*\*\*\*\s+)\d{4}/;
    const lastFourDigits = receiptText.match(cardNumberRegex)[0];
    //console.log(cardNumber)

    const cardTypeRegex = /\b(VISA|MASTERCARD|DEBIT|AMEX|DISCOVER)\b/;
    const cardType = receiptText.match(cardTypeRegex)[1];
    //console.log(cardType)

    const totalRegex = /(\d+\.\d+)\s+TOTAL\s+PURCHASE/;
    const total = receiptText.match(totalRegex)[1];
    //console.log(total)

    // use the extracted information as needed
    return { storeId, purchaseDate, cardType, total, lastFourDigits };
}

function walmartAPICall(forms) {
    return fetch("https://www.walmart.com/chcwebapp/api/receipts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(forms)
    })
        .then(response => response.json())
        .then(data => data.receipts[0].items)
        .catch(error => console.error(error));
}