import express from 'express';
import { config } from './resources/config.js';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import vision from '@google-cloud/vision';
import { getDatabase, ref, set, update, get, child } from "firebase/database";
import fs from 'fs';
import { time } from 'console';
import determineExpirationDate from './util.js';

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
let food_data = JSON.parse(fs.readFileSync('./resources/food_keeper_data_new.json'));

// Product info index
const product_sheet_index = 2;
const product_name_index = 2;

const product_pantry_max_date_index = 10;
const product_pantry_max_date_metric_index = 11;

const product_refrigerate_max_date_index = 21;
const product_refrigerate_max_date_metric_index = 22;
const product_refrigerate_tip_index = 23

const refrigerate_after_opening_max_date_index = 25;
const refrigerate_after_opening_max_date_metric_index = 26;

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

app.post('/submitReceipt', (req, res) => {
    const user_id = req.query.user_id.toLowerCase();
    const image_data = req.query.image_data.toLowerCase();

    const db = getDatabase();
    const dbRef = ref(getDatabase());

    let items = quickstart()

    for(let i = 0;i<items.length;i++) {
        const item_name = items[i]['description'];
        const item_image_link = items[i]['imageUrl'];
        const firebase_expiration_dates_list_ref = `users/${user_id}/items/${item_name}`;
        let item_expiration_dates = []
        
        get(child(dbRef, firebase_expiration_dates_list_ref)).then((snapshot) => {
            if (snapshot.exists()) {
                let snapshot_result = snapshot.val();
                item_expiration_dates = snapshot_result['expiration_dates'];
                item_image_link = snapshot_result['image_link'];
                let selectedItem = 0;
                for (var i = 0; i < list_of_products.length; i++) {
                    if (food_data['sheets'][product_sheet_index]['data'][i][product_name_index]['Name'].toLowerCase() == item_name.toLowerCase()) {
                        // Determine actual expiration date
                        selectedItem = i;
                        const expirationDate = determineExpirationDate(food_data['sheets'][product_sheet_index]['data'][i], open_status);
                        item_expiration_dates.push(expirationDate);
                        const newDataObject = {'expiration_dates': item_expiration_dates, 'image_link': item_image_link}
                        update(ref(db, firebase_expiration_dates_list_ref), newDataObject);
                        break;
                    }
                }
                res.send(JSON.stringify(food_data['sheets'][product_sheet_index]['data'][selectedItem]));
            } else {
                console.log("No data available");
                let selectedItem = 0;
                for (var i = 0; i < list_of_products.length; i++) {
                    if (food_data['sheets'][product_sheet_index]['data'][i][product_name_index]['Name'].toLowerCase() == item_name.toLowerCase()) {
                        // Determine actual expiration date
                        selectedItem = i;
                        const expirationDate = determineExpirationDate(food_data['sheets'][product_sheet_index]['data'][i], open_status);
                        item_expiration_dates.push(expirationDate);
                        const newDataObject = {'expiration_dates': item_expiration_dates, 'image_link': 'https://images.app.goo.gl/DnwWBnSpEPmcF2ee8'}
                        update(ref(db, firebase_expiration_dates_list_ref), newDataObject);
                        break;
                    }
                }
                res.send(JSON.stringify(food_data['sheets'][product_sheet_index]['data'][selectedItem]));
            }
        }).catch((error) => {
            res.send(error);
        });
    }
});


app.delete('/deleteItem/:item_name/:expiration_date', (req, res) => {
    const item_name = req.params.item_name.toLowerCase();
    const target_expiration_date = new Date(req.params.expiration_date);
    const user_id = req.query.user_id.toLowerCase();

    const firebase_expiration_dates_list_ref = `users/${user_id}/items/${item_name}/expiration_dates`;

    let item_expiration_dates = []
    const db = getDatabase();
    // users/${user_id}/items/${item_name}
    const dbRef = ref(getDatabase());
    get(child(dbRef, firebase_expiration_dates_list_ref)).then((snapshot) => {
        console.log(target_expiration_date);
        if (snapshot.exists()) {
            item_expiration_dates = snapshot.val();
            console.log(item_expiration_dates)
            let newList = []
            for (var i = 0; i < item_expiration_dates.length; i++) {
                let currentDate = new Date(item_expiration_dates[i]);
                if (currentDate.getTime() !== target_expiration_date.getTime()) {
                    newList.push(item_expiration_dates[i]);
                }
                else {
                    console.log(item_expiration_dates[i])
                }
            }
            let newDataObject = newList;
            set(ref(db, firebase_expiration_dates_list_ref), newDataObject);
            res.send("Deleted successfully");
        } else {
            res.send("No data available");
        }
    }).catch((error) => {
        console.error(error);
        res.send(error);
    });
});

app.get('/getItems/', (req, res) => {
    const user_id = req.query.user_id;
    const dbRef = ref(getDatabase());
    const firebase_food_item_data = `users/${user_id}/items`;
    
    get(child(dbRef, firebase_food_item_data)).then((snapshot) => {
        if (snapshot.exists()) {
            let currentItems = snapshot.val();
            res.send(currentItems);
        } else {
            res.send("No data available");
        }
    }).catch((error) => {
        console.error(error);
        res.send(error);
    });
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
    return items;
}
// quickstart();
// base64ToImage();

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

function base64ToImage(base64) {
    // Create a base64 string from an image => ztso+Mfuej2mPmLQxgD ...
    //const base64 = fs.readFileSync("./resources/receipt3.png", "base64");
    // Convert base64 to buffer => <Buffer ff d8 ff db 00 43 00 ...
    const buffer = Buffer.from(base64, "base64");
    // Pipes an image with "new-path.jpg" as the name.
    //fs.writeFileSync("./resources/test.png", buffer);
    return buffer;
}