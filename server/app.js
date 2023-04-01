const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs');

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
  selectedItem = 0;
  for(i = 0;i<list_of_products.length;i++) {
    if(food_data['sheets'][product_sheet_index]['data'][i][product_name_index]['Name'].toLowerCase() == item_name.toLowerCase()) {
      console.log(food_data['sheets'][product_sheet_index]['data'][i][product_name_index]);
      console.log(food_data['sheets'][product_sheet_index]['data'][i][product_pantry_max_date_index]);
      console.log(food_data['sheets'][product_sheet_index]['data'][i][product_pantry_max_date_metric_index]);
      console.log(food_data['sheets'][product_sheet_index]['data'][i][product_refrigerate_max_date_index]);
      console.log(food_data['sheets'][product_sheet_index]['data'][i][product_refrigerate_max_date_metric_index]);
      console.log(food_data['sheets'][product_sheet_index]['data'][i][refrigerate_after_opening_max_date_index]);
      console.log(food_data['sheets'][product_sheet_index]['data'][i][refrigerate_after_opening_max_date_metric_index]);
      console.log(' ')
      selectedItem = i;
    }
  }
  res.send(JSON.stringify(food_data['sheets'][product_sheet_index]['data'][selectedItem]));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})