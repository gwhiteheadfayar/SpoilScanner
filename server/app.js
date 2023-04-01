import express from 'express';
import { config } from './resources/config.js';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, update, get, child} from "firebase/database";
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
  for(var i = 0;i<list_of_products.length;i++) {
    if(food_data['sheets'][product_sheet_index]['data'][i][product_name_index]['Name'].toLowerCase() == item_name.toLowerCase()) {
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

app.post('/addItem/:item_name/:open_status', (req, res) => {
  const item_name = req.params.item_name.toLowerCase();
  const open_status = req.params.open_status;
  const user_id = req.query.user_id.toLowerCase();

  let item_expiration_dates  = []
  const db = getDatabase();
  // users/${user_id}/items/${item_name}
  const dbRef = ref(getDatabase());
  get(child(dbRef, `users/${user_id}/items/${item_name}`)).then((snapshot) => {
    if (snapshot.exists()) {
      item_expiration_dates = snapshot.val();
      let selectedItem = 0;
      for(var i = 0;i<list_of_products.length;i++) {
        if(food_data['sheets'][product_sheet_index]['data'][i][product_name_index]['Name'].toLowerCase() == item_name.toLowerCase()) {
          // Determine actual expiration date
          selectedItem = i;
          const expirationDate = determineExpirationDate(food_data['sheets'][product_sheet_index]['data'][i],open_status);
          let newDataObject = {}
          item_expiration_dates.push(expirationDate);
          newDataObject[item_name] = item_expiration_dates;
          update(ref(db, `users/${user_id}/items`), newDataObject);
          break;
        }
      }
      res.send(JSON.stringify(food_data['sheets'][product_sheet_index]['data'][selectedItem]));
    } else {
      console.log("No data available");
      let selectedItem = 0;
      for(var i = 0;i<list_of_products.length;i++) {
        if(food_data['sheets'][product_sheet_index]['data'][i][product_name_index]['Name'].toLowerCase() == item_name.toLowerCase()) {
          // Determine actual expiration date
          selectedItem = i;
          const expirationDate = determineExpirationDate(food_data['sheets'][product_sheet_index]['data'][i],open_status);
          item_expiration_dates.push(expirationDate);
          let newDataObject = {}
          newDataObject[item_name] = item_expiration_dates;
          update(ref(db, `users/${user_id}/items`), newDataObject);
          break;
        }
      }
      res.send(JSON.stringify(food_data['sheets'][product_sheet_index]['data'][selectedItem]));
    }
  }).catch((error) => {
    res.send(error);
  });
});


app.delete('/deleteItem/:item_name/:expiration_date', (req, res) => {
  const item_name = req.params.item_name.toLowerCase();
  const target_expiration_date = new Date(req.params.expiration_date);
  const user_id = req.query.user_id.toLowerCase();

  let item_expiration_dates  = []
  const db = getDatabase();
  // users/${user_id}/items/${item_name}
  const dbRef = ref(getDatabase());
  get(child(dbRef, `users/${user_id}/items/${item_name}`)).then((snapshot) => {
    console.log(target_expiration_date);
    if (snapshot.exists()) {
      item_expiration_dates = snapshot.val();
      let newList = []
      for(var i = 0;i<item_expiration_dates.length;i++) {
        let currentDate = new Date(item_expiration_dates[i]);
        if(currentDate.getTime() !== target_expiration_date.getTime()) {
          newList.push(item_expiration_dates[i]);
        }
        else {
          console.log(item_expiration_dates[i]);
        }
      }
      let newDataObject = {}
      newDataObject[item_name] = newList;
      update(ref(db, `users/${user_id}/items`), newDataObject);
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
  get(child(dbRef, `users/${user_id}/items`)).then((snapshot) => {
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