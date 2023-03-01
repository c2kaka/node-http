const fs = require("fs");
const path = require("path");

let dataCache = null;

function loadData() {
  if (!dataCache) {
    const filePath = path.resolve(__dirname, "../mock/data.json");
    const data = JSON.parse(fs.readFileSync(filePath, { encoding: "utf-8" }));
    const reports = data.dailyReports;
    dataCache = {};

    reports.forEach((report) => {
      if (report && report.updatedDate) {
        dataCache[report.updatedDate] = report;
      }
    });
  }

  return dataCache;
}

function getCoronavirusKeyIndex() {
  return Object.keys(loadData());
}

function getCoronavirusByDate(date) {
  const dailyData = loadData()[date] || {};
  if (dailyData.countries) {
    dailyData.countries.sort((a, b) => {
      return b.confirmed - a.confirmed;
    });
  }
  return dailyData;
}

module.exports = {
  getCoronavirusByDate,
  getCoronavirusKeyIndex,
};
