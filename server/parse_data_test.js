const fs = require('fs');

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

for(i = 0;i<list_of_products.length;i++) {
    console.log(food_data['sheets'][product_sheet_index]['data'][i][product_name_index]);
    console.log(food_data['sheets'][product_sheet_index]['data'][i][product_pantry_max_date_index]);
    console.log(food_data['sheets'][product_sheet_index]['data'][i][product_pantry_max_date_metric_index]);
    console.log(food_data['sheets'][product_sheet_index]['data'][i][product_refrigerate_max_date_index]);
    console.log(food_data['sheets'][product_sheet_index]['data'][i][product_refrigerate_max_date_metric_index]);
    console.log(food_data['sheets'][product_sheet_index]['data'][i][refrigerate_after_opening_max_date_index]);
    console.log(food_data['sheets'][product_sheet_index]['data'][i][refrigerate_after_opening_max_date_metric_index]);
    console.log(' ')
}