const rp = require("request-promise");
const fs = require("fs");
var dateFormat = require("dateformat");

function isValidEvent(event) {
  let days = 7;
  let last = new Date(new Date().getTime() - days * 24 * 60 * 60 * 1000);
  return new Date(event.open_dt) >= last;
}

async function getRecords(offset) {
  try {
    let res = await rp(
      `https://data.boston.gov/api/3/action/datastore_search?offset=${offset}&resource_id=6ff6a6fd-3141-4440-a880-6f60a37fe789`
    );
    let responseData = await JSON.parse(res);
    let events = [];
    if (responseData.success) {
      events = await responseData.result.records.map(
        ({ _id, open_dt, case_title, submittedphoto, location }) => ({
          _id,
          open_dt,
          case_title,
          submittedphoto,
          location,
        })
      );
      return events.filter(isValidEvent);
    } else {
      return [];
    }
  } catch (err) {
    return [];
  }
}

async function get311RecordCount() {
  try {
    let res = await rp(
      `https://data.boston.gov/api/3/action/datastore_search?limit=1&resource_id=6ff6a6fd-3141-4440-a880-6f60a37fe789`
    );
    let responseData = await JSON.parse(res);
    return responseData.success ? responseData.result.total : 0;
  } catch (err) {
    return 0;
  }
}

// async function parse311() {
//   const writeStream = fs.createWriteStream("312.json");
//   const totalCount = await get311RecordCount();
//   console.log(totalCount);
//   let offset = totalCount;
//   let totalArrays = [];
//   while (offset >= 100) {
//     offset -= 100;
//     console.log(offset);
//     let partArrays = await getRecords(offset);
//     if (partArrays.length === 0) break;
//     totalArrays = [...totalArrays, ...partArrays];
//   }
//   const data = {
//     createdAt: new Date(),
//     total: totalArrays.length,
//     records: totalArrays.sort((a, b) => b._id - a._id),
//   };
//   writeStream.write(JSON.stringify(data));
//   setTimeout(parse311, 300 * 1000);
// }

async function parse311() {
  const days = 7;
  let last = new Date(new Date().getTime() - days * 24 * 60 * 60 * 1000);
  let filterStartDate = dateFormat(last, "isoDateTime");
  try {
    let res = await rp(
      `https://data.boston.gov/api/3/action/datastore_search_sql?sql=SELECT _id, case_enquiry_id, open_dt, case_title, submittedphoto, location from "6ff6a6fd-3141-4440-a880-6f60a37fe789" WHERE "location_zipcode" LIKE '02127' and "open_dt" >= '${filterStartDate}' order by _id desc`
    );
    let responseData = await JSON.parse(res);
    if (responseData.success && responseData.result) {
      if (responseData.result.records.length === 0) return;
      const writeStream = fs.createWriteStream("311.json");
      const data = {
        createdAt: new Date(),
        total: responseData.result.records.length,
        records: responseData.result.records,
      };
      writeStream.write(JSON.stringify(data));
    }
  } catch (err) {
    // console.log(err);
  } finally {
    setTimeout(parse311, 3600 * 1000);
  }
}

parse311();
