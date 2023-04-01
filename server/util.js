const product_sheet_index = 2;
const product_name_index = 2;

const product_pantry_max_date_index = 10;
const product_pantry_max_date_metric_index = 11;

const product_refrigerate_max_date_index = 21;
const product_refrigerate_max_date_metric_index = 22;
const product_refrigerate_tip_index = 23

const refrigerate_after_opening_max_date_index = 25;
const refrigerate_after_opening_max_date_metric_index = 26;

function determineExpirationDate (item, open_status) {
    let timeOffset = 60 * 1000;
    // Determine actual expiration date
    if(item[product_pantry_max_date_metric_index]['DOP_Pantry_Metric'] == 'Months') {
        timeOffset = timeOffset * 60 * 24 * 30 * item[product_pantry_max_date_index]['DOP_Pantry_Max'];
    }

    if(item[product_pantry_max_date_metric_index]['DOP_Pantry_Metric'] == 'Days') {
        timeOffset = timeOffset * 60 * 24 * item[product_pantry_max_date_index]['DOP_Pantry_Max'];
    }

    if(item[product_pantry_max_date_metric_index]['DOP_Refrigerate_Metric'] == 'Months') {
        timeOffset = timeOffset * 60 * 24 * 30 * item[product_refrigerate_max_date_index]['Refrigerate_After_Opening_Max'];
    }

    if(item[product_pantry_max_date_metric_index]['DOP_Refrigerate_Metric'] == 'Days') {
        timeOffset = timeOffset * 60 * 24 * item[product_refrigerate_max_date_index]['Refrigerate_After_Opening_Max'];
    }
    if(Boolean(open_status) == true) {
        if(item[refrigerate_after_opening_max_date_metric_index]['Refrigerate_After_Opening_Metric'] == 'Months') {
            timeOffset = timeOffset * 60 * 24 * 30 * item[refrigerate_after_opening_max_date_index]['Refrigerate_After_Opening_Max'];
        }
        if(item[refrigerate_after_opening_max_date_metric_index]['Refrigerate_After_Opening_Metric'] == 'Days') {
            timeOffset = timeOffset * 60 * 24 * item[refrigerate_after_opening_max_date_index]['Refrigerate_After_Opening_Max'];
        }
    }
    console.log(new Date(Date.now() + timeOffset))
    return new Date(Date.now() + timeOffset);
};

export default determineExpirationDate;